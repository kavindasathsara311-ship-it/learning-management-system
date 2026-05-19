const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool } = require("pg");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs");

const app = express();
const JWT_SECRET = "lms_secret_key_123";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, '../resources/lesson materials');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public"))); // Serve static files from public directory

// PostgreSQL connection
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "schoolLMS",
  password: "KAVINDA123",
  port: 5432,
});

// Nodemailer Transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "kavindasathsara320@gmail.com",
    pass: "pfkd zwum swio bkbo",
  },
});

// In-memory store for pending registrations
const pendingRegistrations = new Map();

// --- Helper Functions ---

// Middleware to verify JWT
function verifyToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Get token from "Bearer <token>"

  if (!token) {
    return res.status(403).json({ message: "Token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid token" });
  }
}

async function sendOtpEmail(email, otp) {
  const mailOptions = {
    from: "kavindasathsara320@gmail.com",
    to: email,
    subject: "LMS Registration OTP",
    text: `Your OTP for registration is: ${otp}`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}: ${otp}`);
  } catch (error) {
    console.error("Error sending email:", error);
    console.log(`(Fallback) OTP for ${email}: ${otp}`);
  }
}

async function insertStudent(userData) {
  const { name, id, email, phone, address, password, grade_id } = userData;
  let gradeId = String(grade_id).trim();
  if (/^\d+$/.test(gradeId)) {
    gradeId = gradeId + "A";
  }
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO student 
    (student_name, student_reg_no, email, phone_number, address, password, grade_id) 
    VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [name, id, email, phone, address, hashedPassword, gradeId]
  );
}

async function insertTeacher(userData) {
  const { name, id, email, phone, password, teachingSubjects } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO teacher (teacher_name, teacher_reg_no, email, phone_number, password) VALUES ($1, $2, $3, $4, $5) RETURNING teacher_id",
      [name, id, email, phone, hashedPassword]
    );
    const internalTeacherId = result.rows[0].teacher_id;

    for (const subId of teachingSubjects) {
      await client.query(
        "INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [internalTeacherId, subId]
      );
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// --- Routes ---

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "LoginPage.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "LoginPage.html"));
});

// 1. Initiate Registration (Generate OTP)
app.post("/register-init", async (req, res) => {
  const { email, role, ...userData } = req.body;

  if (!email || !role) {
    return res.status(400).send("Email and role are required.");
  }

  try {
    const table = role === 'student' ? 'student' : 'teacher';
    const existingEmail = await pool.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).send("Email already registered.");
    }
    
    // Check if ID already exists to prevent 500 error after OTP verification
    const idField = role === 'student' ? 'student_reg_no' : 'teacher_reg_no';
    const existingId = await pool.query(`SELECT * FROM ${table} WHERE ${idField} = $1`, [userData.id]);
    if (existingId.rows.length > 0) {
      return res.status(400).send("Register Number (ID) already registered.");
    }

    // Check if subjects are valid for teacher and resolve to subject_ids
    if (role === 'teacher') {
       const subjectInputs = userData.teachingSubjects;
       if (!Array.isArray(subjectInputs) || subjectInputs.length === 0) {
         return res.status(400).send("At least one teaching subject is required.");
       }
       const validSubjectIds = [];
       for (const subjectInput of subjectInputs) {
         const subjRes = await pool.query("SELECT subject_id FROM subject WHERE subject_id = $1 OR subject_name ILIKE $2 LIMIT 1", [subjectInput, `%${subjectInput}%`]);
         if (subjRes.rows.length === 0) {
           return res.status(400).send(`Invalid Teaching Subject: ${subjectInput}. Please verify the subject name or ID.`);
         }
         validSubjectIds.push(subjRes.rows[0].subject_id);
       }
       userData.teachingSubjects = validSubjectIds;
    }
  } catch (err) {
    console.error("Error checking existing user:", err);
    return res.status(500).send("Server error checking user.");
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  pendingRegistrations.set(email, {
    userData: { email, ...userData },
    role,
    otp,
    expiresAt
  });

  await sendOtpEmail(email, otp);
  res.send("OTP sent to email. Please verify.");
});

// 2. Verify OTP and Complete Registration
app.post("/verify-otp", async (req, res) => {
  const { email, otp } = req.body;
  const record = pendingRegistrations.get(email);

  if (!record) {
    return res.status(400).json({ success: false, message: "No pending registration found for this email. Please register again." });
  }

  if (Date.now() > record.expiresAt) {
    pendingRegistrations.delete(email);
    return res.status(400).json({ success: false, message: "OTP expired. Please register again." });
  }

  if (record.otp !== otp) {
    return res.status(400).json({ success: false, message: "Invalid OTP." });
  }

  try {
    if (record.role === "student") {
      await insertStudent(record.userData);
      const token = jwt.sign(
        {
          id: record.userData.id,
          name: record.userData.name,
          email: record.userData.email,
          role: "student"
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      pendingRegistrations.delete(email);
      return res.json({ success: true, message: "Student registered successfully", token });

    } else if (record.role === "teacher") {
      await insertTeacher(record.userData);
      const token = jwt.sign(
        {
          id: record.userData.id,
          name: record.userData.name,
          email: record.userData.email,
          role: "teacher"
        },
        JWT_SECRET,
        { expiresIn: "1h" }
      );
      pendingRegistrations.delete(email);
      return res.json({ success: true, message: "Teacher registered successfully", token });
    } else {
      return res.status(400).json({ success: false, message: "Invalid role." });
    }

  } catch (err) {
    console.error("DB Insertion Error:", err);
    res.status(500).json({ success: false, message: "Failed to register user: " + err.message });
  }
});

// 3. Resend OTP
app.post("/resend-otp", async (req, res) => {
  const { email } = req.body;
  const record = pendingRegistrations.get(email);

  if (!record) {
    return res.status(400).send("No pending registration found.");
  }

  const newOtp = Math.floor(100000 + Math.random() * 900000).toString();
  record.otp = newOtp;
  record.expiresAt = Date.now() + 10 * 60 * 1000;
  pendingRegistrations.set(email, record);

  await sendOtpEmail(email, newOtp);
  res.send("OTP resent.");
});

// Login Endpoints
app.post("/student-login", async (req, res) => {
  const { email, password } = req.body;
  const result = await pool.query("SELECT * FROM student WHERE email = $1", [email]);

  if (result.rows.length === 0) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const student = result.rows[0];
  const isMatch = await bcrypt.compare(password, student.password);

  if (!isMatch) {
    return res.status(401).json({ success: false, message: "Invalid credentials" });
  }

  const token = jwt.sign(
    {
      id: student.student_reg_no,
      name: student.student_name,
      email: student.email,
      grade: student.grade_id,
      role: "student"
    },
    JWT_SECRET,
    { expiresIn: "1h" }
  );

  res.json({ success: true, message: "Login successful", token });
});

app.post("/teacher-login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM teacher WHERE email = $1", [email]);

    if (result.rows.length > 0) {
      const teacher = result.rows[0];
      const isMatch = await bcrypt.compare(password, teacher.password);

      if (isMatch) {
        const token = jwt.sign(
          {
            id: teacher.teacher_reg_no,
            name: teacher.teacher_name,
            email: teacher.email,
            role: "teacher"
          },
          JWT_SECRET,
          { expiresIn: "1h" }
        );
        res.json({ success: true, message: "Login successful", token });
      } else {
        res.status(401).json({ success: false, message: "Invalid credentials" });
      }
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Login failed: " + err.message });
  }
});

// Dashboard Endpoints
app.get("/student-dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).send("Access denied");
  }
  res.json({ message: "Welcome Student" });
});

app.get("/teacher-dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "teacher") {
    return res.status(403).send("Access denied");
  }
  res.json({ message: "Welcome Teacher" });
});

// API Routes
app.get("/student-subjects", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).send("Access denied");
  }

  const gradeId = req.user.grade;
  const studentId = req.user.id;

  try {
    const result = await pool.query(
       `SELECT s.subject_id, s.subject_name
       FROM enrolled_subjects es
       JOIN subject s ON es.subject_id = s.subject_id
       WHERE es.student_id = (SELECT student_id FROM student WHERE student_reg_no = $1)`,
      [studentId]
    );
    res.json({ enrolled_subjects: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching subjects");
  }
});

app.get("/student-searched-subjects", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).send("Access denied");
  }

  const { subjectName } = req.query;
  const gradeId = req.user.grade;

  try {
    const result = await pool.query(
      "SELECT * FROM subject WHERE grade_id = $1 AND subject_name ILIKE $2",
      [gradeId, `%${subjectName}%`]
    );
    res.json({ subjects: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error fetching searched subjects");
  }
});

app.get("/verify-subject-code", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).send("Access denied");
  }

  const { subjectCode } = req.query;

  try {
    const result = await pool.query(
      "SELECT * FROM enrolled_subjects where student_id = (SELECT student_id FROM student WHERE student_id = $1) AND subject_id = $2",
      [req.user.id, subjectCode]
    );
    res.json({ valid: result.rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error verifying subject code");
  }
});

// student_server.js
app.use(express.json()); // MUST be before routes

app.post("/api/enroll-subject", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { subjectCode } = req.body; 

  if (!subjectCode || subjectCode.trim() === "") {
    return res.status(400).json({ success: false, message: "Invalid subject code" });
  }

  try {
    const id = req.user.id;

    const studentResult = await pool.query("SELECT student_id FROM student WHERE student_id = $1", [id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    const internalStudentId = studentResult.rows[0].student_id;

    const subjectCheck = await pool.query("SELECT * FROM subject WHERE subject_id=$1", [subjectCode]);
    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Subject not found. Please enter a valid subject ID." });
    }

    const check = await pool.query(
      "SELECT * FROM enrolled_subjects WHERE student_id=$1 AND subject_id=$2",
      [internalStudentId, subjectCode]
    );

    if (check.rows.length > 0) {
      return res.json({ success: false, message: "Already enrolled" });
    }

    const result = await pool.query(
      "INSERT INTO enrolled_subjects (student_id, subject_id) VALUES ($1, $2) RETURNING *",
      [internalStudentId, subjectCode]
    );

    res.json({ success: true, message: "Enrolled successfully", enrollment: result.rows[0] });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Enrollment failed" });
  }
});

// Start server
app.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});

app.post("/api/exam-schedule", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const gradeId = req.user.grade;
    const result = await pool.query(
      `SELECT s.subject_name, se.date, se.time
        FROM subject_exam se 
        INNER JOIN Exam e ON se.exam_id = e.exam_id
        INNER JOIN subject s ON se.subject_id = s.subject_id
        WHERE e.grade_id = $1`,
      [gradeId]
    );
    res.json({ exam_schedule: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching exam schedule" });
  }
})

app.post("/api/timeTable", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  try{
    const gradeId = req.user.grade;
    const result = await pool.query(
      `SELECT s.subject_name, tt.weekDay, tt.startTime, tt.endTime
       FROM timeTable_Subject tt
       INNER JOIN subject s ON tt.subject_id = s.subject_id
       INNER JOIN timeTable t ON tt.timeTable_id = t.timeTable_id
	     where t.grade_id = $1 `,
      [gradeId]
    );
    res.json({ time_table: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching time table" });

  }
});

// teacher server.js
app.post("/api/view-classes", verifyToken, async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ success: false, message: "Access denied" });
    }
    try{
        const teacherRegNo = req.user.id;
        const result = await pool.query(
            `SELECT ts.subject_id, subject_name, grade_name FROM teacher_subjects ts
              INNER JOIN subject s ON ts.subject_id = s.subject_id
              INNER JOIN grade g ON s.grade_id = g.grade_id
              WHERE ts.teacher_id = (SELECT teacher_id FROM teacher WHERE teacher_reg_no = $1)`,
            [teacherRegNo]
        );
        res.json({ classes: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching classes" });
    }
});

app.post("/api/teacher-timetable", verifyToken, async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ success: false, message: "Access denied" });
    }
    try{
        const teacherRegNo = req.user.id;
        const result = await pool.query(
            `select subject_name,weekDay,startTime,endTime
              from timeTable_subject tt 
              INNER JOIN teacher_subjects ts ON tt.subject_id = ts.subject_id
              INNER JOIN subject s ON ts.subject_id = s.subject_id
              where ts.teacher_id = (SELECT teacher_id FROM teacher WHERE teacher_reg_no = $1)`,
            [teacherRegNo]
        );
        res.json({ timetable: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching timetable" });
    }
});

app.post("/api/upload-lesson-material", verifyToken, upload.single('lessonFile'), async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ success: false, message: "Access denied" });
    }
    try {
        const { lesson_name, display_name, subject_id } = req.body;
        const file = req.file;

        if (!file || !display_name || !subject_id || !lesson_name) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const teacherRegNo = req.user.id;

        // Retrieve internal teacher_id
        const teacherRes = await pool.query("SELECT teacher_id FROM teacher WHERE teacher_reg_no = $1", [teacherRegNo]);
        if (teacherRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }
        const teacherInternalId = teacherRes.rows[0].teacher_id;
        

        // Insert into course_materials
        const fileUrl = `/resources/lesson materials/${file.filename}`;

        let lesson_id = await pool.query(
          "SELECT lesson_id FROM lesson WHERE lesson_name=$1", 
          [lesson_name]
        );

        if (lesson_id.rows.length === 0) {
            await pool.query(
              "INSERT INTO lesson (lesson_name,subject_id) VALUES ($1, $2)",
              [lesson_name, subject_id]
            );

            lesson_id = await pool.query(
              "SELECT lesson_id FROM lesson WHERE lesson_name=$1",
              [lesson_name]
            );
        }

        await pool.query(
            `INSERT INTO course_materials 
            (teacher_id, subject_id, lesson_id, display_name, storage_key, file_url, mime_type, file_size_bytes)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [teacherInternalId, subject_id, lesson_id.rows[0].lesson_id, display_name, file.filename, fileUrl, file.mimetype, file.size]
        );

        res.json({ success: true, message: "Lesson material uploaded successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error uploading lesson material" });
    }
});

app.post("/api/view-course-materials", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher") {
      return res.status(403).json({ success: false, message: "Access denied" });
  }

  try{
      const result = await pool.query(
          `SELECT DISTINCT lesson_name, lesson_id from lesson where subject_id = $1`,
          [req.body.subject_id]
      );
      res.json({ courseMaterials: result.rows });
  } catch (err) {
      console.error(err);
      res.status(500).json({ success: false, message: "Error fetching course materials" });
  }
});

app.post("/api/get-lesson-material-file", verifyToken, async (req, res) => {
    try {
        const { lesson_id, subject_id } = req.body;
        console.log("SUCCESS: Route hit with:", { lesson_id, subject_id });

        console.log("DEBUG DATA:", { 
            lesson_id, 
            lesson_type: typeof lesson_id, 
            subject_id, 
            subject_type: typeof subject_id 
        });

        // DISTINCT prevents the same file from showing up multiple times
        const result = await pool.query(
            `SELECT file_url, display_name, updated_at 
             FROM course_materials 
             WHERE subject_id = $1 AND lesson_id = $2::int`,
            [subject_id, lesson_id]
        );

        if (result.rows.length === 0) {
            // Send 200 with empty array so frontend loop doesn't crash
            return res.json({ getLessonMaterialFile: [] });
        }

       res.json({ 
            getLessonMaterialFile: result.rows || [] 
        });
    } catch (err) {
        console.error("DATABASE ERROR:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});
/*
app.post("/api/get-lesson-material-file", verifyToken, async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ success: false, message: "Access denied" });
    }

    try {
        const { lesson_id } = req.body;
        const subjectId = req.body.subject_id;
        const teacherRegNo = req.user.id;

        const teacherRes = await pool.query("SELECT teacher_id FROM teacher WHERE teacher_reg_no = $1", [teacherRegNo]);
        if (teacherRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const result = await pool.query(
              `SELECT DISTINCT 
                  file_url, 
                  display_name, 
                  updated_at AS upload_date 
              FROM course_materials 
              WHERE subject_id = $1 AND lesson_id = $2`,
              [subjectId, lesson_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Lesson material not found" });
        }

        // Send the whole array of rows
        res.json({ getLessonMaterialFile: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching lesson material" });
    }
});
*/
app.post("/api/create-class", verifyToken, async (req, res) => {
    if (req.user.role !== "teacher") {
        return res.status(403).json({ success: false, message: "Access denied" });
    }
    try {
        const { subject_name, grade_name} = req.body;
        const teacherRegNo = req.user.id;
        const teacherRes = await pool.query("SELECT teacher_id FROM teacher WHERE teacher_reg_no = $1", [teacherRegNo]);

        if (teacherRes.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Teacher not found" });
        }

        const subjectId = await pool.query(`SELECT subject_id FROM subject s
                                            INNER JOIN grade g ON s.grade_id = g.grade_id
                                            WHERE g.grade_name = $1 AND s.subject_name= $2
                                          `,[grade_name,subject_name]
                                        );

        const teacherInternalId = teacherRes.rows[0].teacher_id;
        const subject_id = subjectId.rows[0].subject_id;

        await pool.query(
            "INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
            [teacherInternalId, subject_id]
        );
        res.json({ success: true, message: "Class created successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error creating class" });
    }
});
