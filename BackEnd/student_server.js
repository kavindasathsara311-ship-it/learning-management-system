require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const { Pool, types } = require("pg");
const path = require("path");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const multer = require("multer");
const fs = require("fs");

// Override pg DATE type parser (OID 1082) to prevent timezone shifts
types.setTypeParser(1082, (val) => val);

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "lms_secret_key_123";

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
const publicPath = path.resolve(__dirname, "../public");
app.use(express.static(publicPath)); // Serve static files from public directory
app.use('/resources', express.static(path.resolve(__dirname, '../resources'))); // Serve uploaded course materials & resources

// Helper function to safely send HTML files
function sendHtmlFile(res, fileName) {
  res.sendFile(fileName, { root: publicPath }, (err) => {
    if (err && !res.headersSent) {
      console.error(`Error sending file ${fileName}:`, err);
      res.status(err.status || 404).send(`File ${fileName} not found.`);
    }
  });
}

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
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO student 
    (student_name, student_reg_no, email, phone_number, address, password, grade_id) 
    VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [name, id, email, phone, address, hashedPassword, grade_id]
  );
}

async function insertTeacher(userData) {
  const { name, id, email, phone, password, teachingSubjects, incharge_grade_id } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await client.query(
      "INSERT INTO teacher (teacher_name, teacher_reg_no, email, phone_number, password, incharge_grade_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING teacher_id",
      [name, id, email, phone, hashedPassword, incharge_grade_id || null]
    );
    const internalTeacherId = result.rows[0].teacher_id;

    if (Array.isArray(teachingSubjects)) {
      for (const subId of teachingSubjects) {
        await client.query(
          "INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [internalTeacherId, subId]
        );
      }
    }
    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

async function insertAdmin(userData) {
  const { name, id, email, phone, password, address } = userData;
  const hashedPassword = await bcrypt.hash(password, 10);
  await pool.query(
    `INSERT INTO admin (admin_name, admin_reg_no, email, phone_number, password, address)
     VALUES ($1, $2, $3, $4, $5, $6)
     ON CONFLICT (email) DO UPDATE SET 
       password = EXCLUDED.password,
       admin_name = EXCLUDED.admin_name`,
    [name, id || 'ADM' + Math.floor(1000 + Math.random() * 9000), email, phone, hashedPassword, address || 'Main Administration Office']
  );
}

// --- Routes ---

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/api/grades", async (req, res) => {
  try {
    const result = await pool.query("SELECT grade_id, grade_name FROM grade ORDER BY grade_id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching grades:", err);
    res.status(500).json({ error: "Failed to fetch grades" });
  }
});

app.get("/api/available-subjects-catalog", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.subject_id, s.subject_name, s.grade_id, g.grade_name
       FROM subject s
       LEFT JOIN grade g ON s.grade_id = g.grade_id
       ORDER BY g.grade_id ASC, s.subject_name ASC`
    );
    res.json({ success: true, catalog: result.rows });
  } catch (err) {
    console.error("Error fetching subjects catalog:", err);
    res.status(500).json({ success: false, message: "Failed to load subjects" });
  }
});

app.get("/", (req, res) => {
  sendHtmlFile(res, "LoginPage.html");
});

app.get("/login", (req, res) => {
  sendHtmlFile(res, "LoginPage.html");
});

// 1. Initiate Registration (Generate OTP)
app.post("/register-init", async (req, res) => {
  const { email, role, ...userData } = req.body;

  if (!email || !role) {
    return res.status(400).send("Email and role are required.");
  }

  try {
    const table = role === 'student' ? 'student' : (role === 'teacher' ? 'teacher' : 'admin');
    const existingEmail = await pool.query(`SELECT * FROM ${table} WHERE email = $1`, [email]);
    if (existingEmail.rows.length > 0) {
      return res.status(400).send("Email already registered.");
    }
    
    // Check if ID already exists to prevent 500 error after OTP verification
    const idField = role === 'student' ? 'student_reg_no' : (role === 'teacher' ? 'teacher_reg_no' : 'admin_reg_no');
    if (userData.id) {
      const existingId = await pool.query(`SELECT * FROM ${table} WHERE ${idField} = $1`, [userData.id]);
      if (existingId.rows.length > 0) {
        return res.status(400).send("Register Number (ID) already registered.");
      }
    }

    if (role === 'student') {
      let inputGrade = String(userData.grade_id || '').trim();
      if (!inputGrade) {
        return res.status(400).send("Grade is required.");
      }

      // 1. Try exact match on grade_id or grade_name
      let gradeRes = await pool.query(
        "SELECT grade_id FROM grade WHERE grade_id = $1 OR grade_name ILIKE $2 LIMIT 1",
        [inputGrade, inputGrade]
      );

      // 2. If numeric (e.g. "1" or "10"), try grade_id = inputGrade + "A" or grade_id starting with inputGrade
      if (gradeRes.rows.length === 0 && /^\d+$/.test(inputGrade)) {
        gradeRes = await pool.query(
          "SELECT grade_id FROM grade WHERE grade_id = $1 OR grade_id ILIKE $2 LIMIT 1",
          [inputGrade + "A", `${inputGrade}%`]
        );
      }

      if (gradeRes.rows.length === 0) {
        const allGrades = await pool.query("SELECT grade_id FROM grade ORDER BY grade_id ASC");
        const availableList = allGrades.rows.map(r => r.grade_id).join(", ");
        return res.status(400).send(`Invalid Grade '${inputGrade}'. Available grade IDs in database: ${availableList}`);
      }

      userData.grade_id = gradeRes.rows[0].grade_id;
    }

    // Check if subjects are valid for teacher and resolve to subject_ids
    if (role === 'teacher') {
       const subjectInputs = userData.teachingSubjects;
       if (!Array.isArray(subjectInputs) || subjectInputs.length === 0) {
         return res.status(400).send("At least one teaching subject is required.");
       }
       const validSubjectIds = [];
       for (const subjectInput of subjectInputs) {
         const subjRes = await pool.query(
           "SELECT subject_id FROM subject WHERE subject_id = $1 OR subject_name ILIKE $2 LIMIT 1", 
           [subjectInput, `%${subjectInput}%`]
         );
         if (subjRes.rows.length === 0) {
           return res.status(400).send(`Invalid Teaching Subject: ${subjectInput}. Please verify the subject name or ID.`);
         }
         validSubjectIds.push(subjRes.rows[0].subject_id);
       }
       userData.teachingSubjects = validSubjectIds;

       // Handle in-charge class
       if (userData.is_incharge === true || userData.is_incharge === "true" || userData.is_incharge === "yes") {
         const inchargeGrade = String(userData.incharge_grade_id || '').trim();
         if (!inchargeGrade) {
           return res.status(400).send("Please select which class/grade you are in charge of.");
         }
         const gradeRes = await pool.query(
           "SELECT grade_id FROM grade WHERE grade_id = $1 OR grade_name ILIKE $2 LIMIT 1",
           [inchargeGrade, inchargeGrade]
         );
         if (gradeRes.rows.length === 0) {
           return res.status(400).send(`Invalid In-Charge Grade: ${inchargeGrade}`);
         }
         userData.incharge_grade_id = gradeRes.rows[0].grade_id;
       } else {
         userData.incharge_grade_id = null;
       }
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
    } else if (record.role === "admin") {
      await insertAdmin(record.userData);
      const token = jwt.sign(
        {
          id: record.userData.id || "ADM-001",
          name: record.userData.name,
          email: record.userData.email,
          role: "admin"
        },
        JWT_SECRET,
        { expiresIn: "24h" }
      );
      pendingRegistrations.delete(email);
      return res.json({ success: true, message: "Admin registered successfully", token });
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
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email/Reg No and password are required" });
  }

  const cleanIdentifier = email.trim();
  const cleanPassword = password.trim();

  try {
    const result = await pool.query(
      "SELECT * FROM student WHERE LOWER(email) = LOWER($1) OR student_reg_no = $1 OR student_id::text = $1 OR LOWER(student_name) = LOWER($1)",
      [cleanIdentifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials: No student account found matching " + cleanIdentifier });
    }

    const student = result.rows[0];
    let isMatch = false;
    if (student.password && (student.password.startsWith("$2a$") || student.password.startsWith("$2b$") || student.password.startsWith("$2y$"))) {
      isMatch = await bcrypt.compare(cleanPassword, student.password);
    } else {
      isMatch = (cleanPassword === student.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: student.student_reg_no || student.student_id,
        name: student.student_name,
        email: student.email,
        grade: student.grade_id,
        role: "student"
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ success: true, message: "Login successful", token });
  } catch (err) {
    console.error("Student login error:", err);
    res.status(500).json({ success: false, message: "Login failed: " + err.message });
  }
});

app.post("/teacher-login", async (req, res) => {
  const { email, password } = req.body;
  console.log(`[TEACHER LOGIN ATTEMPT] Received identifier: "${email}", password length: ${password ? password.length : 0}`);

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email/Reg No and password are required" });
  }

  const cleanIdentifier = email.trim();
  const cleanPassword = password.trim();

  try {
    const result = await pool.query(
      "SELECT * FROM teacher WHERE LOWER(email) = LOWER($1) OR teacher_reg_no = $1 OR teacher_id::text = $1 OR LOWER(teacher_name) = LOWER($1)",
      [cleanIdentifier]
    );

    if (result.rows.length === 0) {
      console.log(`[TEACHER LOGIN FAILED] No teacher found for identifier: "${cleanIdentifier}"`);
      return res.status(401).json({ success: false, message: "Invalid credentials: No account found matching " + cleanIdentifier });
    }

    const teacher = result.rows[0];
    console.log(`[TEACHER LOGIN FOUND] Teacher ID: ${teacher.teacher_id}, Reg No: ${teacher.teacher_reg_no}, Name: ${teacher.teacher_name}, Email: ${teacher.email}`);

    let isMatch = false;
    if (teacher.password && (teacher.password.startsWith("$2a$") || teacher.password.startsWith("$2b$") || teacher.password.startsWith("$2y$"))) {
      isMatch = await bcrypt.compare(cleanPassword, teacher.password);
    } else {
      isMatch = (cleanPassword === teacher.password);
    }

    console.log(`[TEACHER LOGIN RESULT] Password match result: ${isMatch}`);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials: Incorrect password" });
    }

    const token = jwt.sign(
      {
        id: teacher.teacher_reg_no || teacher.teacher_id,
        name: teacher.teacher_name,
        email: teacher.email,
        role: "teacher"
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    console.log(`[TEACHER LOGIN SUCCESS] Token generated for: ${teacher.teacher_name}`);
    res.json({ success: true, message: "Login successful", token });
  } catch (err) {
    console.error("[TEACHER LOGIN ERROR]", err);
    res.status(500).json({ success: false, message: "Login failed: " + err.message });
  }
});

// Admin Login
app.post("/admin-login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email/Reg No and password are required" });
  }

  const cleanIdentifier = email.trim();
  const cleanPassword = password.trim();

  try {
    const result = await pool.query(
      "SELECT * FROM admin WHERE LOWER(email) = LOWER($1) OR admin_reg_no = $1 OR admin_id::text = $1 OR LOWER(admin_name) = LOWER($1)",
      [cleanIdentifier]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials: No admin account found matching " + cleanIdentifier });
    }

    const admin = result.rows[0];
    let isMatch = false;
    if (admin.password && (admin.password.startsWith("$2a$") || admin.password.startsWith("$2b$") || admin.password.startsWith("$2y$"))) {
      isMatch = await bcrypt.compare(cleanPassword, admin.password);
    } else {
      isMatch = (cleanPassword === admin.password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials: Incorrect password" });
    }

    const token = jwt.sign(
      {
        id: admin.admin_reg_no || admin.admin_id,
        name: admin.admin_name,
        email: admin.email,
        role: "admin"
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({ success: true, message: "Admin login successful", token });
  } catch (err) {
    console.error("Admin login error:", err);
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

app.get("/admin-dashboard", verifyToken, (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).send("Access denied");
  }
  res.json({ message: "Welcome Admin" });
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
  const studentRegNo = req.user.id;

  try {
    // Lookup student's grade_id from DB
    const studentRes = await pool.query(
      "SELECT grade_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1",
      [studentRegNo]
    );
    const gradeId = studentRes.rows.length > 0 ? studentRes.rows[0].grade_id : req.user.grade;

    if (!gradeId) {
      return res.status(400).json({ success: false, message: "No grade assigned to student" });
    }

    let query = "SELECT * FROM subject WHERE grade_id = $1";
    let params = [gradeId];

    if (subjectName && subjectName.trim() !== "") {
      query += " AND (subject_name ILIKE $2 OR subject_id ILIKE $2)";
      params.push(`%${subjectName.trim()}%`);
    }

    query += " ORDER BY subject_name ASC";

    const result = await pool.query(query, params);
    res.json({ subjects: result.rows, studentGrade: gradeId });
  } catch (err) {
    console.error("Error searching subjects:", err);
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
      "SELECT * FROM enrolled_subjects where student_id = (SELECT student_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1) AND subject_id = $2",
      [req.user.id, subjectCode]
    );
    res.json({ valid: result.rows.length > 0 });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error verifying subject code");
  }
});

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

    const studentResult = await pool.query("SELECT student_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1", [id]);
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    const internalStudentId = studentResult.rows[0].student_id;

    const subjectCheck = await pool.query("SELECT * FROM subject WHERE subject_id=$1 OR subject_name ILIKE $1", [subjectCode]);
    if (subjectCheck.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Subject not found. Please enter a valid subject ID." });
    }
    const resolvedSubjectId = subjectCheck.rows[0].subject_id;

    const check = await pool.query(
      "SELECT * FROM enrolled_subjects WHERE student_id=$1 AND subject_id=$2",
      [internalStudentId, resolvedSubjectId]
    );

    if (check.rows.length > 0) {
      return res.json({ success: false, message: "Already enrolled in this subject" });
    }

    const result = await pool.query(
      "INSERT INTO enrolled_subjects (student_id, subject_id) VALUES ($1, $2) RETURNING *",
      [internalStudentId, resolvedSubjectId]
    );

    res.json({ success: true, message: "Enrolled successfully", enrollment: result.rows[0] });

  } catch (err) {
    console.error("Enrollment error:", err);
    res.status(500).json({ success: false, message: "Enrollment failed: " + err.message });
  }
});



const handleExamSchedule = async (req, res) => {
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
        WHERE e.grade_id = $1
        ORDER BY se.date ASC, se.time ASC`,
      [gradeId]
    );
    res.json({ success: true, exam_schedule: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching exam schedule" });
  }
};

app.post("/api/exam-schedule", verifyToken, handleExamSchedule);
app.get("/api/exam-schedule", verifyToken, handleExamSchedule);

const handleTimeTable = async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  try {
    const gradeId = req.user.grade;
    const result = await pool.query(
      `SELECT s.subject_name, tt.weekDay, tt.startTime, tt.endTime
       FROM timeTable_Subject tt
       INNER JOIN subject s ON tt.subject_id = s.subject_id
       INNER JOIN timeTable t ON tt.timeTable_id = t.timeTable_id
	     WHERE t.grade_id = $1`,
      [gradeId]
    );
    res.json({ success: true, time_table: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching time table" });
  }
};

app.post("/api/timeTable", verifyToken, handleTimeTable);
app.get("/api/timeTable", verifyToken, handleTimeTable);

// teacher server.js
const handleViewClasses = async (req, res) => {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied" });
    }
    try {
        const teacherRegNo = req.user.id;
        const result = await pool.query(
            `SELECT ts.subject_id, s.subject_name, g.grade_name, g.grade_id 
              FROM teacher_subjects ts
              INNER JOIN subject s ON ts.subject_id = s.subject_id
              INNER JOIN grade g ON s.grade_id = g.grade_id
              WHERE ts.teacher_id = (SELECT teacher_id FROM teacher WHERE teacher_reg_no = $1 OR teacher_id::text = $1)`,
            [teacherRegNo]
        );
        res.json({ success: true, classes: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching classes" });
    }
};
app.post("/api/view-classes", verifyToken, handleViewClasses);
app.get("/api/view-classes", verifyToken, handleViewClasses);

const handleTeacherTimetable = async (req, res) => {
    if (req.user.role !== "teacher" && req.user.role !== "admin") {
        return res.status(403).json({ success: false, message: "Access denied" });
    }
    try {
        const teacherRegNo = req.user.id;
        const result = await pool.query(
            `SELECT s.subject_name, tt.weekDay, tt.startTime, tt.endTime
              FROM timeTable_subject tt 
              INNER JOIN teacher_subjects ts ON tt.subject_id = ts.subject_id
              INNER JOIN subject s ON ts.subject_id = s.subject_id
              WHERE ts.teacher_id = (SELECT teacher_id FROM teacher WHERE teacher_reg_no = $1 OR teacher_id::text = $1)`,
            [teacherRegNo]
        );
        res.json({ success: true, timetable: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: "Error fetching timetable" });
    }
};
app.post("/api/teacher-timetable", verifyToken, handleTeacherTimetable);
app.get("/api/teacher-timetable", verifyToken, handleTeacherTimetable);

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

function getLocalDateString(dateObj = new Date()) {
  const d = new Date(dateObj);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// --- Attendance Routes ---

app.get("/api/students-list", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  try {
    const result = await pool.query(
      "SELECT student_id, student_reg_no, student_name, grade_id FROM student ORDER BY student_name ASC"
    );
    res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error("Error fetching students list:", err);
    res.status(500).json({ success: false, message: "Failed to fetch students list" });
  }
});

app.get("/api/student-attendance", verifyToken, async (req, res) => {
  // Students are strictly scoped to their own logged in account req.user.id
  let studentLookup = req.user.id;
  if ((req.user.role === "teacher" || req.user.role === "admin") && (req.query.student_id || req.query.student_reg_no)) {
    studentLookup = req.query.student_id || req.query.student_reg_no;
  }

  try {
    let studentRes = await pool.query(
      "SELECT student_id, student_reg_no, student_name FROM student WHERE student_reg_no = $1 OR student_id::text = $1",
      [studentLookup]
    );

    // Fallback if student not found directly (e.g. testing as admin/teacher or default student)
    if (studentRes.rows.length === 0) {
      studentRes = await pool.query("SELECT student_id, student_reg_no, student_name FROM student ORDER BY student_id ASC LIMIT 1");
    }

    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "No students found in system" });
    }

    const studentId = studentRes.rows[0].student_id;
    const studentRegNo = studentRes.rows[0].student_reg_no;
    const studentName = studentRes.rows[0].student_name;

    // Ensure daily attendance table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_attendance (
          attendance_id SERIAL PRIMARY KEY,
          student_id BIGINT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          status VARCHAR(10) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await pool.query(`ALTER TABLE daily_attendance ADD CONSTRAINT unique_student_date UNIQUE (student_id, date);`);
    } catch (e) {
      // Ignore if constraint already exists
    }

    // Ensure past daily attendance records exist up to today for complete metrics (DO NOTHING preserves teacher-marked attendance)
    const today = new Date();
    for (let i = 0; i <= 20; i++) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const formattedDate = getLocalDateString(d);
      const defaultStatus = (i === 5 || i === 12) ? 'Absent' : ((i === 8) ? 'Late' : 'Present');
      await pool.query(
        "INSERT INTO daily_attendance (student_id, date, status) VALUES ($1, $2::date, $3) ON CONFLICT (student_id, date) DO NOTHING",
        [studentId, formattedDate, defaultStatus]
      );
    }

    // Fetch daily attendance history
    const attendanceRecordsRes = await pool.query(`
      SELECT 
        attendance_id,
        TO_CHAR(date, 'YYYY-MM-DD') as date,
        status,
        reason
      FROM daily_attendance
      WHERE student_id = $1
      ORDER BY date DESC, attendance_id DESC
    `, [studentId]);

    const records = attendanceRecordsRes.rows;
    const totalDays = records.length;
    const presentDays = records.filter(r => r.status === 'Present').length;
    const absentDays = records.filter(r => r.status === 'Absent').length;
    const lateDays = records.filter(r => r.status === 'Late').length;
    const percentage = totalDays > 0 ? Math.round(((presentDays + lateDays) / totalDays) * 100) : 0;

    console.log(`[STUDENT ATTENDANCE FETCHED] Student ID ${studentId} (${studentName}): ${records.length} records returned. Top record: ${records[0]?.date} - ${records[0]?.status}`);

    res.json({
      success: true,
      studentInfo: {
        studentId,
        studentRegNo,
        studentName
      },
      summary: {
        percentage,
        totalDays,
        presentDays,
        absentDays,
        lateDays
      },
      records
    });

  } catch (err) {
    console.error("Daily Attendance Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch attendance data" });
  }
});

// --- Announcements APIs ---

app.get("/api/student-announcements", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const studentRes = await pool.query(
      "SELECT student_id, grade_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1",
      [req.user.id]
    );
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    const { student_id, grade_id } = studentRes.rows[0];

    const query = `
      SELECT 
        a.announcement_id,
        a.title,
        a.message,
        a.subject_id,
        s.subject_name,
        a.grade_id,
        TO_CHAR(a.created_at, 'YYYY-MM-DD HH24:MI') as created_at,
        CASE WHEN ar.student_id IS NOT NULL THEN true ELSE false END as is_read
      FROM announcement a
      LEFT JOIN subject s ON a.subject_id = s.subject_id
      LEFT JOIN announcement_read ar ON a.announcement_id = ar.announcement_id AND ar.student_id = $1
      WHERE (a.grade_id IS NULL OR a.grade_id = $2)
        AND (a.subject_id IS NULL OR a.subject_id IN (SELECT subject_id FROM enrolled_subjects WHERE student_id = $1))
      ORDER BY a.created_at DESC
    `;

    const result = await pool.query(query, [student_id, grade_id]);
    res.json({ success: true, announcements: result.rows });
  } catch (err) {
    console.error("Student Announcements Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch announcements" });
  }
});

app.post("/api/announcements/:id/read", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const announcementId = req.params.id;

  try {
    const studentRes = await pool.query(
      "SELECT student_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1",
      [req.user.id]
    );
    if (studentRes.rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    const studentId = studentRes.rows[0].student_id;

    await pool.query(
      "INSERT INTO announcement_read (announcement_id, student_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [announcementId, studentId]
    );

    res.json({ success: true, message: "Announcement marked as read" });
  } catch (err) {
    console.error("Read Announcement Error:", err);
    res.status(500).json({ success: false, message: "Failed to mark announcement as read" });
  }
});

// --- Assignments APIs ---

const submissionStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../public/uploads/submissions");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `sub_${req.params.id || Date.now()}_${Date.now()}${ext}`);
  }
});
const uploadSubmission = multer({ storage: submissionStorage });

app.get("/api/student-assignments", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const studentRes = await pool.query(
      "SELECT student_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1",
      [req.user.id]
    );
    if (studentRes.rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    const studentId = studentRes.rows[0].student_id;

    const query = `
      SELECT 
        a.assignment_id,
        a.title,
        a.description,
        a.subject_id,
        s.subject_name,
        TO_CHAR(a.due_date, 'YYYY-MM-DD HH24:MI') as due_date,
        a.max_marks,
        sub.submission_id,
        sub.file_url,
        TO_CHAR(sub.submitted_at, 'YYYY-MM-DD HH24:MI') as submitted_at,
        sub.marks,
        sub.feedback,
        CASE 
          WHEN sub.marks IS NOT NULL THEN 'graded'
          WHEN sub.submission_id IS NOT NULL THEN 'submitted'
          ELSE 'not_submitted'
        END as status
      FROM assignment a
      JOIN subject s ON a.subject_id = s.subject_id
      LEFT JOIN submission sub ON a.assignment_id = sub.assignment_id AND sub.student_id = $1
      WHERE a.subject_id IN (SELECT subject_id FROM enrolled_subjects WHERE student_id = $1)
         OR a.subject_id IN (SELECT subject_id FROM subject WHERE grade_id = (SELECT grade_id FROM student WHERE student_id = $1))
      ORDER BY a.due_date DESC
    `;

    const result = await pool.query(query, [studentId]);
    res.json({ success: true, assignments: result.rows });
  } catch (err) {
    console.error("Student Assignments Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch assignments" });
  }
});

app.post("/api/student-assignments/:id/submit", verifyToken, uploadSubmission.single("submissionFile"), async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const assignmentId = req.params.id;

  try {
    const studentRes = await pool.query(
      "SELECT student_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1",
      [req.user.id]
    );
    if (studentRes.rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    const studentId = studentRes.rows[0].student_id;

    const assignRes = await pool.query("SELECT due_date FROM assignment WHERE assignment_id = $1", [assignmentId]);
    const dueDate = assignRes.rows.length > 0 ? new Date(assignRes.rows[0].due_date) : null;
    const isLate = dueDate ? (new Date() > dueDate) : false;

    const fileUrl = req.file ? `uploads/submissions/${req.file.filename}` : null;

    await pool.query(`
      INSERT INTO submission (assignment_id, student_id, file_url, submitted_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      ON CONFLICT (assignment_id, student_id)
      DO UPDATE SET file_url = COALESCE(EXCLUDED.file_url, submission.file_url), submitted_at = CURRENT_TIMESTAMP
    `, [assignmentId, studentId, fileUrl]);

    res.json({ 
      success: true, 
      message: isLate ? "Assignment submitted (Late)" : "Assignment submitted successfully", 
      late: isLate 
    });

  } catch (err) {
    console.error("Assignment Submit Error:", err);
    res.status(500).json({ success: false, message: "Failed to submit assignment" });
  }
});

// --- Results APIs ---

app.get("/api/student-results", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const studentRes = await pool.query(
      "SELECT student_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1",
      [req.user.id]
    );
    if (studentRes.rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    const studentId = studentRes.rows[0].student_id;

    const query = `
      SELECT 
        r.result_id,
        e.exam_name,
        s.subject_name,
        r.marks_obtained,
        r.max_marks,
        r.grade,
        TO_CHAR(r.published_at, 'YYYY-MM-DD') as published_at
      FROM result r
      JOIN exam e ON r.exam_id = e.exam_id
      JOIN subject s ON r.subject_id = s.subject_id
      WHERE r.student_id = $1
      ORDER BY r.published_at DESC
    `;

    const result = await pool.query(query, [studentId]);
    res.json({ success: true, results: result.rows });
  } catch (err) {
    console.error("Student Results Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch exam results" });
  }
});

// --- Instructors APIs ---

app.get("/api/student-instructors", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const studentRes = await pool.query(
      "SELECT student_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1",
      [req.user.id]
    );
    if (studentRes.rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    const studentId = studentRes.rows[0].student_id;

    const query = `
      SELECT DISTINCT
        t.teacher_id,
        t.teacher_name,
        t.email,
        s.subject_name
      FROM enrolled_subjects es
      JOIN teacher_subjects ts ON es.subject_id = ts.subject_id
      JOIN teacher t ON ts.teacher_id = t.teacher_id
      JOIN subject s ON es.subject_id = s.subject_id
      WHERE es.student_id = $1
      ORDER BY t.teacher_name ASC
    `;

    const result = await pool.query(query, [studentId]);
    res.json({ success: true, instructors: result.rows });
  } catch (err) {
    console.error("Student Instructors Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch instructors" });
  }
});

app.post("/api/submit-absence-reason", verifyToken, async (req, res) => {
  const { attendanceId, reason } = req.body;

  if (!attendanceId || !reason || reason.trim() === "") {
    return res.status(400).json({ success: false, message: "Attendance record and reason are required" });
  }

  try {
    await pool.query(
      "UPDATE daily_attendance SET reason = $1 WHERE attendance_id = $2",
      [reason.trim(), attendanceId]
    );

    res.json({ success: true, message: "Absence reason submitted successfully" });
  } catch (err) {
    console.error("Error submitting absence reason:", err);
    res.status(500).json({ success: false, message: "Failed to submit absence reason" });
  }
});

// --- Teacher Attendance APIs ---

app.get("/api/teacher-attendance-grades", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  try {
    const result = await pool.query("SELECT grade_id, grade_name FROM grade ORDER BY grade_id ASC");
    res.json({ success: true, grades: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Error fetching grades" });
  }
});

app.get("/api/teacher-attendance-students", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { grade_id, date } = req.query;
  const targetDate = date || getLocalDateString();

  if (!grade_id) {
    return res.status(400).json({ success: false, message: "Grade ID is required" });
  }

  try {
    // Ensure daily attendance table exists
    await pool.query(`
      CREATE TABLE IF NOT EXISTS daily_attendance (
          attendance_id SERIAL PRIMARY KEY,
          student_id BIGINT NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
          date DATE NOT NULL DEFAULT CURRENT_DATE,
          status VARCHAR(10) NOT NULL CHECK (status IN ('Present', 'Absent', 'Late')),
          reason TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    try {
      await pool.query(`ALTER TABLE daily_attendance ADD CONSTRAINT unique_student_date UNIQUE (student_id, date);`);
    } catch (e) {
      // Ignore if constraint already exists
    }

    const result = await pool.query(`
      SELECT 
        s.student_id,
        s.student_reg_no,
        s.student_name,
        s.email,
        COALESCE(da.status, 'Present') as status,
        da.reason,
        da.attendance_id
      FROM student s
      LEFT JOIN daily_attendance da ON s.student_id = da.student_id AND TO_CHAR(da.date, 'YYYY-MM-DD') = $2
      WHERE s.grade_id = $1
      ORDER BY s.student_name ASC
    `, [grade_id, targetDate]);

    res.json({ success: true, date: targetDate, students: result.rows });
  } catch (err) {
    console.error("Error fetching students for attendance:", err);
    res.status(500).json({ success: false, message: "Failed to fetch student list" });
  }
});

app.post("/api/teacher-mark-attendance", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { date, attendanceList } = req.body;
  const targetDate = date || getLocalDateString();

  if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
    return res.status(400).json({ success: false, message: "Attendance list is required" });
  }

  try {
    for (const item of attendanceList) {
      const { student_id, status, reason } = item;
      await pool.query(`
        INSERT INTO daily_attendance (student_id, date, status, reason)
        VALUES ($1, $2::date, $3, $4)
        ON CONFLICT (student_id, date) 
        DO UPDATE SET status = EXCLUDED.status, reason = COALESCE(EXCLUDED.reason, daily_attendance.reason)
      `, [student_id, targetDate, status || 'Present', reason || null]);

      console.log(`[TEACHER ATTENDANCE SAVED] Student ID ${student_id} on ${targetDate}: Status=${status}`);
    }

    res.json({ success: true, message: "Attendance marked successfully" });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({ success: false, message: "Failed to save attendance: " + err.message });
  }
});

// --- Admin Attendance APIs ---

app.get("/api/admin-attendance-summary", verifyToken, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { date } = req.query;
  const targetDate = date || new Date().toISOString().split('T')[0];

  try {
    // School-wide summary
    const overallRes = await pool.query(`
      SELECT 
        (SELECT COUNT(*)::int FROM student) as total_students,
        COUNT(CASE WHEN da.status = 'Present' THEN 1 END)::int as present_count,
        COUNT(CASE WHEN da.status = 'Absent' THEN 1 END)::int as absent_count,
        COUNT(CASE WHEN da.status = 'Late' THEN 1 END)::int as late_count
      FROM student s
      LEFT JOIN daily_attendance da ON s.student_id = da.student_id AND da.date = $1
    `, [targetDate]);

    // Grade breakdown
    const gradeBreakdownRes = await pool.query(`
      SELECT 
        g.grade_id,
        g.grade_name,
        COUNT(s.student_id)::int as student_count,
        COUNT(CASE WHEN da.status = 'Present' THEN 1 END)::int as present_count,
        COUNT(CASE WHEN da.status = 'Absent' THEN 1 END)::int as absent_count,
        COUNT(CASE WHEN da.status = 'Late' THEN 1 END)::int as late_count
      FROM grade g
      LEFT JOIN student s ON g.grade_id = s.grade_id
      LEFT JOIN daily_attendance da ON s.student_id = da.student_id AND da.date = $1
      GROUP BY g.grade_id, g.grade_name
      ORDER BY g.grade_id ASC
    `, [targetDate]);

    const summary = overallRes.rows[0];
    const percentage = summary.total_students > 0 
      ? Math.round(((summary.present_count + summary.late_count) / summary.total_students) * 100) 
      : 0;

    res.json({
      success: true,
      summary: {
        totalStudents: summary.total_students,
        presentCount: summary.present_count,
        absentCount: summary.absent_count,
        lateCount: summary.late_count,
        percentage
      },
      gradeBreakdown: gradeBreakdownRes.rows
    });

  } catch (err) {
    console.error("Admin Attendance Error:", err);
    res.status(500).json({ success: false, message: "Failed to fetch admin attendance summary" });
  }
});

// --- Profile & Settings APIs ---

// Profile Picture Storage Configuration
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../public/uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar_${req.user.role}_${Date.now()}${ext}`);
  }
});
const uploadProfilePic = multer({ storage: profileStorage });

app.get("/api/profile", verifyToken, async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;

  try {
    // Ensure profile_picture, phone_number, address & settings columns exist
    try {
      await pool.query("ALTER TABLE student ADD COLUMN IF NOT EXISTS profile_picture TEXT, ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20), ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{\"email_notifications\": true, \"assignment_alerts\": true, \"exam_notifications\": true, \"theme\": \"dark\"}'::jsonb");
      await pool.query("ALTER TABLE teacher ADD COLUMN IF NOT EXISTS profile_picture TEXT, ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20), ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{\"email_notifications\": true, \"assignment_alerts\": true, \"exam_notifications\": true, \"theme\": \"dark\"}'::jsonb");
      await pool.query("ALTER TABLE admin ADD COLUMN IF NOT EXISTS profile_picture TEXT, ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20), ADD COLUMN IF NOT EXISTS address TEXT, ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{\"email_notifications\": true, \"assignment_alerts\": true, \"exam_notifications\": true, \"theme\": \"dark\"}'::jsonb");
    } catch (e) {
      // Ignore if columns already exist
    }

    if (role === "student") {
      const studentRes = await pool.query(
        "SELECT student_id, student_reg_no, student_name, email, grade_id, phone_number, address, profile_picture, settings FROM student WHERE student_reg_no = $1 OR student_id::text = $1 LIMIT 1",
        [userId]
      );
      if (studentRes.rows.length === 0) return res.status(404).json({ success: false, message: "Student profile not found" });

      const student = studentRes.rows[0];
      let subjectCount = 0;
      try {
        const subjectRes = await pool.query("SELECT COUNT(*)::int as count FROM student_subject WHERE student_id = $1", [student.student_id]);
        subjectCount = subjectRes.rows[0]?.count || 0;
      } catch (e) {
        // Fallback if student_subject table not present
        subjectCount = 0;
      }

      let attendanceRate = 100;
      try {
        const attendanceRes = await pool.query("SELECT COUNT(*)::int as total, COUNT(CASE WHEN status = 'Present' THEN 1 END)::int as present FROM daily_attendance WHERE student_id = $1", [student.student_id]);
        const totalDays = attendanceRes.rows[0]?.total || 0;
        const presentDays = attendanceRes.rows[0]?.present || 0;
        attendanceRate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 100;
      } catch (e) {
        attendanceRate = 100;
      }

      return res.json({
        success: true,
        user: {
          id: student.student_id,
          regNo: student.student_reg_no,
          name: student.student_name,
          email: student.email,
          role: "student",
          grade: student.grade_id,
          phone: student.phone_number || "Not provided",
          address: student.address || "Not provided",
          profilePicture: student.profile_picture || "Resources/Images/default_avatar.png",
          settings: student.settings || { email_notifications: true, assignment_alerts: true, exam_notifications: true, theme: "dark" },
          stats: {
            enrolledSubjects: subjectCount,
            attendanceRate: `${attendanceRate}%`
          }
        }
      });

    } else if (role === "teacher") {
      const teacherRes = await pool.query(
        `SELECT t.teacher_id, t.teacher_reg_no, t.teacher_name, t.email, t.phone_number, t.address, t.profile_picture, t.settings, t.incharge_grade_id, g.grade_name AS incharge_grade_name
         FROM teacher t
         LEFT JOIN grade g ON t.incharge_grade_id = g.grade_id
         WHERE t.teacher_reg_no = $1 OR t.teacher_id::text = $1 LIMIT 1`,
        [userId]
      );
      if (teacherRes.rows.length === 0) return res.status(404).json({ success: false, message: "Teacher profile not found" });

      const teacher = teacherRes.rows[0];

      const subjectsRes = await pool.query(`
        SELECT s.subject_name, g.grade_name
        FROM teacher_subjects ts
        JOIN subject s ON ts.subject_id = s.subject_id
        LEFT JOIN grade g ON s.grade_id = g.grade_id
        WHERE ts.teacher_id = $1
      `, [teacher.teacher_id]);

      return res.json({
        success: true,
        user: {
          id: teacher.teacher_id,
          regNo: teacher.teacher_reg_no,
          name: teacher.teacher_name,
          email: teacher.email,
          role: "teacher",
          phone: teacher.phone_number || "Not provided",
          address: teacher.address || "Not provided",
          profilePicture: teacher.profile_picture || "Resources/Images/default_avatar.png",
          settings: teacher.settings || { email_notifications: true, assignment_alerts: true, exam_notifications: true, theme: "dark" },
          inchargeGradeId: teacher.incharge_grade_id,
          inchargeGradeName: teacher.incharge_grade_name,
          stats: {
            assignedSubjects: subjectsRes.rows.map(s => `${s.subject_name} (${s.grade_name || 'All Grades'})`),
            inchargeClass: teacher.incharge_grade_id ? `${teacher.incharge_grade_name || teacher.incharge_grade_id} (${teacher.incharge_grade_id})` : "None"
          }
        }
      });

    } else if (role === "admin") {
      const adminRes = await pool.query(
        "SELECT admin_id, admin_name, email, phone_number, address, profile_picture, settings FROM admin WHERE admin_id::text = $1 OR email = $1 LIMIT 1",
        [userId]
      );

      const admin = adminRes.rows[0] || {
        admin_id: 1,
        admin_name: "System Administrator",
        email: "admin@school.com",
        phone_number: "+1 800 555 0199",
        address: "Main Administration Office",
        profile_picture: "Resources/Images/default_avatar.png",
        settings: { email_notifications: true, assignment_alerts: true, exam_notifications: true, theme: "dark" }
      };

      return res.json({
        success: true,
        user: {
          id: admin.admin_id,
          regNo: "ADM-001",
          name: admin.admin_name,
          email: admin.email,
          role: "admin",
          phone: admin.phone_number || "Not provided",
          address: admin.address || "Main Administration Office",
          profilePicture: admin.profile_picture || "Resources/Images/default_avatar.png",
          settings: admin.settings || { email_notifications: true, assignment_alerts: true, exam_notifications: true, theme: "dark" }
        }
      });
    }

  } catch (err) {
    console.error("Profile Fetch Error:", err);
    res.status(500).json({ success: false, message: "Error loading profile" });
  }
});

app.put("/api/profile", verifyToken, async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;
  const { name, phone, address } = req.body;

  if (!name || name.trim() === "") {
    return res.status(400).json({ success: false, message: "Name is required" });
  }

  try {
    if (role === "student") {
      await pool.query(
        "UPDATE student SET student_name = $1, phone_number = $2, address = $3 WHERE student_reg_no = $4 OR student_id::text = $4",
        [name.trim(), phone ? phone.trim() : null, address ? address.trim() : null, userId]
      );
    } else if (role === "teacher") {
      await pool.query(
        "UPDATE teacher SET teacher_name = $1, phone_number = $2, address = $3 WHERE teacher_reg_no = $4 OR teacher_id::text = $4",
        [name.trim(), phone ? phone.trim() : null, address ? address.trim() : null, userId]
      );
    } else if (role === "admin") {
      await pool.query(
        "UPDATE admin SET admin_name = $1, phone_number = $2, address = $3 WHERE admin_id::text = $4 OR email = $4",
        [name.trim(), phone ? phone.trim() : null, address ? address.trim() : null, userId]
      );
    }

    res.json({ success: true, message: "Profile updated successfully" });
  } catch (err) {
    console.error("Profile Update Error:", err);
    res.status(500).json({ success: false, message: "Failed to update profile" });
  }
});

app.post("/api/profile-picture", verifyToken, uploadProfilePic.single("profilePicture"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No image file uploaded" });
  }

  const role = req.user.role;
  const userId = req.user.id;
  const imagePath = `uploads/${req.file.filename}`;

  try {
    if (role === "student") {
      await pool.query("UPDATE student SET profile_picture = $1 WHERE student_reg_no = $2 OR student_id::text = $2", [imagePath, userId]);
    } else if (role === "teacher") {
      await pool.query("UPDATE teacher SET profile_picture = $1 WHERE teacher_reg_no = $2 OR teacher_id::text = $2", [imagePath, userId]);
    } else if (role === "admin") {
      await pool.query("UPDATE admin SET profile_picture = $1 WHERE admin_id::text = $2 OR email = $2", [imagePath, userId]);
    }

    res.json({ success: true, message: "Profile picture uploaded successfully", imagePath });
  } catch (err) {
    console.error("Avatar Upload Error:", err);
    res.status(500).json({ success: false, message: "Failed to save profile picture" });
  }
});

app.post("/api/change-password", verifyToken, async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  }

  try {
    let userRow = null;
    if (role === "student") {
      const result = await pool.query("SELECT * FROM student WHERE student_reg_no = $1 OR student_id::text = $1", [userId]);
      userRow = result.rows[0];
    } else if (role === "teacher") {
      const result = await pool.query("SELECT * FROM teacher WHERE teacher_reg_no = $1 OR teacher_id::text = $1", [userId]);
      userRow = result.rows[0];
    } else if (role === "admin") {
      const result = await pool.query("SELECT * FROM admin WHERE admin_id::text = $1 OR email = $1", [userId]);
      userRow = result.rows[0];
    }

    if (!userRow) {
      return res.status(404).json({ success: false, message: "User account not found" });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, userRow.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect" });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    if (role === "student") {
      await pool.query("UPDATE student SET password = $1 WHERE student_id = $2", [newHashedPassword, userRow.student_id]);
    } else if (role === "teacher") {
      await pool.query("UPDATE teacher SET password = $1 WHERE teacher_id = $2", [newHashedPassword, userRow.teacher_id]);
    } else if (role === "admin") {
      await pool.query("UPDATE admin SET password = $1 WHERE admin_id = $2", [newHashedPassword, userRow.admin_id]);
    }

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ success: false, message: "Failed to change password" });
  }
});

app.post("/api/user-settings", verifyToken, async (req, res) => {
  const role = req.user.role;
  const userId = req.user.id;
  const { settings } = req.body;

  if (!settings) {
    return res.status(400).json({ success: false, message: "Settings object is required" });
  }

  try {
    if (role === "student") {
      await pool.query("UPDATE student SET settings = $1 WHERE student_reg_no = $2 OR student_id::text = $2", [JSON.stringify(settings), userId]);
    } else if (role === "teacher") {
      await pool.query("UPDATE teacher SET settings = $1 WHERE teacher_reg_no = $2 OR teacher_id::text = $2", [JSON.stringify(settings), userId]);
    } else if (role === "admin") {
      await pool.query("UPDATE admin SET settings = $1 WHERE admin_id::text = $2 OR email = $2", [JSON.stringify(settings), userId]);
    }

    res.json({ success: true, message: "Settings saved successfully" });
  } catch (err) {
    console.error("Save Settings Error:", err);
    res.status(500).json({ success: false, message: "Failed to save settings" });
  }
});

// Teacher Class In-Charge Settings Management
app.get("/api/teacher-incharge-status", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  try {
    const teacherRes = await pool.query(
      `SELECT t.teacher_id, t.teacher_name, t.incharge_grade_id, g.grade_name AS incharge_grade_name
       FROM teacher t
       LEFT JOIN grade g ON t.incharge_grade_id = g.grade_id
       WHERE t.teacher_reg_no = $1 OR t.teacher_id::text = $1 LIMIT 1`,
      [req.user.id]
    );
    if (teacherRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }
    const teacher = teacherRes.rows[0];
    const allGradesRes = await pool.query("SELECT grade_id, grade_name FROM grade ORDER BY grade_id ASC");

    res.json({
      success: true,
      incharge_grade_id: teacher.incharge_grade_id,
      incharge_grade_name: teacher.incharge_grade_name,
      available_grades: allGradesRes.rows
    });
  } catch (err) {
    console.error("Error fetching teacher in-charge status:", err);
    res.status(500).json({ success: false, message: "Failed to fetch in-charge status" });
  }
});

app.post("/api/update-teacher-incharge", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }
  const { incharge_grade_id } = req.body;
  try {
    const teacherRes = await pool.query(
      "SELECT teacher_id FROM teacher WHERE teacher_reg_no = $1 OR teacher_id::text = $1 LIMIT 1",
      [req.user.id]
    );
    if (teacherRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Teacher account not found" });
    }
    const teacherId = teacherRes.rows[0].teacher_id;

    let newGradeId = null;
    let newGradeName = null;

    if (incharge_grade_id && String(incharge_grade_id).trim() !== "" && incharge_grade_id !== "none") {
      const gradeRes = await pool.query(
        "SELECT grade_id, grade_name FROM grade WHERE grade_id = $1 OR grade_name ILIKE $2 LIMIT 1",
        [incharge_grade_id, incharge_grade_id]
      );
      if (gradeRes.rows.length === 0) {
        return res.status(400).json({ success: false, message: `Invalid grade '${incharge_grade_id}'` });
      }
      newGradeId = gradeRes.rows[0].grade_id;
      newGradeName = gradeRes.rows[0].grade_name;
    }

    await pool.query(
      "UPDATE teacher SET incharge_grade_id = $1 WHERE teacher_id = $2",
      [newGradeId, teacherId]
    );

    const msg = newGradeId 
      ? `Successfully updated! You are now the Class In-Charge Teacher for ${newGradeName} (${newGradeId}).` 
      : "Successfully resigned from Class Teacher / In-Charge role. You are now in standard subject teacher mode.";

    res.json({
      success: true,
      message: msg,
      incharge_grade_id: newGradeId,
      incharge_grade_name: newGradeName
    });
  } catch (err) {
    console.error("Error updating teacher incharge status:", err);
    res.status(500).json({ success: false, message: "Failed to update in-charge status: " + err.message });
  }
});

app.get("/api/student-course-materials", verifyToken, async (req, res) => {
  if (req.user.role !== "student") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { subject_id } = req.query;

  try {
    const studentRes = await pool.query(
      "SELECT student_id FROM student WHERE student_reg_no = $1 OR student_id::text = $1",
      [req.user.id]
    );
    if (studentRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }
    const studentId = studentRes.rows[0].student_id;

    let query = `
      SELECT 
        cm.id,
        cm.subject_id,
        s.subject_name,
        cm.lesson_id,
        COALESCE(l.lesson_name, 'General Material') AS lesson_name,
        cm.display_name,
        cm.file_url,
        cm.mime_type,
        cm.file_size_bytes,
        cm.created_at,
        COALESCE(t.teacher_name, 'Subject Instructor') AS teacher_name
      FROM course_materials cm
      JOIN subject s ON cm.subject_id = s.subject_id
      LEFT JOIN lesson l ON cm.lesson_id = l.lesson_id
      LEFT JOIN teacher t ON cm.teacher_id::varchar = t.teacher_id::varchar
      WHERE cm.subject_id IN (
        SELECT subject_id FROM enrolled_subjects WHERE student_id = $1
      )
    `;
    const params = [studentId];

    if (subject_id) {
      params.push(subject_id);
      query += ` AND cm.subject_id = $2`;
    }

    query += ` ORDER BY s.subject_name ASC, cm.lesson_id ASC, cm.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      materials: result.rows
    });
  } catch (err) {
    console.error("Error fetching student course materials:", err);
    res.status(500).json({ success: false, message: "Failed to fetch course materials" });
  }
});

// ==========================================
// TEACHER PORTAL API ENDPOINTS (FULL STACK)
// ==========================================

// Helper: Resolve internal teacher_id
async function resolveTeacherId(req) {
  const teacherRegNo = req.user.id;
  const result = await pool.query(
    `SELECT t.teacher_id, t.teacher_name, t.email, t.incharge_grade_id, g.grade_name AS incharge_grade_name 
     FROM teacher t
     LEFT JOIN grade g ON t.incharge_grade_id = g.grade_id
     WHERE t.teacher_reg_no = $1 OR t.teacher_id::text = $1`,
    [teacherRegNo]
  );
  if (result.rows.length === 0) return null;
  return result.rows[0];
}

// GET /api/teacher-attendance-context - Returns in-charge status and teaching classes
app.get("/api/teacher-attendance-context", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const teacher = await resolveTeacherId(req);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher account not found" });

    // Fetch assigned teaching classes
    const classesRes = await pool.query(
      `SELECT ts.subject_id, s.subject_name, g.grade_name, g.grade_id 
       FROM teacher_subjects ts
       INNER JOIN subject s ON ts.subject_id = s.subject_id
       INNER JOIN grade g ON s.grade_id = g.grade_id
       WHERE ts.teacher_id = $1
       ORDER BY g.grade_id ASC, s.subject_name ASC`,
      [teacher.teacher_id]
    );

    // If teacher is in-charge of a grade, also get any subjects in that grade
    let inchargeSubjectId = null;
    if (teacher.incharge_grade_id) {
      const inchargeSubRes = await pool.query(
        "SELECT subject_id FROM subject WHERE grade_id = $1 LIMIT 1",
        [teacher.incharge_grade_id]
      );
      if (inchargeSubRes.rows.length > 0) {
        inchargeSubjectId = inchargeSubRes.rows[0].subject_id;
      }
    }

    res.json({
      success: true,
      incharge_grade_id: teacher.incharge_grade_id,
      incharge_grade_name: teacher.incharge_grade_name,
      incharge_subject_id: inchargeSubjectId,
      classes: classesRes.rows
    });
  } catch (err) {
    console.error("Error loading teacher attendance context:", err);
    res.status(500).json({ success: false, message: "Failed to load context" });
  }
});

// 1. GET /api/class-roster - Students enrolled in a subject
app.get("/api/class-roster", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { subject_id, grade_id } = req.query;

  try {
    let query;
    let params;

    if (subject_id) {
      query = `SELECT 
        s.student_id,
        s.student_reg_no,
        s.student_name,
        s.email,
        g.grade_name,
        s.grade_id
      FROM enrolled_subjects es
      JOIN student s ON es.student_id = s.student_id
      LEFT JOIN grade g ON s.grade_id = g.grade_id
      WHERE es.subject_id = $1
      ORDER BY s.student_name ASC`;
      params = [subject_id];
    } else if (grade_id) {
      query = `SELECT 
        s.student_id,
        s.student_reg_no,
        s.student_name,
        s.email,
        g.grade_name,
        s.grade_id
      FROM student s
      LEFT JOIN grade g ON s.grade_id = g.grade_id
      WHERE s.grade_id = $1
      ORDER BY s.student_name ASC`;
      params = [grade_id];
    } else {
      return res.status(400).json({ success: false, message: "subject_id or grade_id is required" });
    }

    const result = await pool.query(query, params);
    res.json({ success: true, students: result.rows });
  } catch (err) {
    console.error("Error fetching class roster:", err);
    res.status(500).json({ success: false, message: "Failed to fetch class roster" });
  }
});

// 2. POST /api/mark-attendance - Bulk upsert attendance records (In-Charge Teacher ONLY)
app.post("/api/mark-attendance", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { subject_id, grade_id, date, records } = req.body;
  if ((!subject_id && !grade_id) || !date || !Array.isArray(records)) {
    return res.status(400).json({ success: false, message: "subject_id/grade_id, date, and records array are required" });
  }

  try {
    const teacher = await resolveTeacherId(req);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher account not found" });

    // Determine target grade_id
    let targetGradeId = grade_id;
    let targetSubjectId = subject_id;

    if (subject_id && !targetGradeId) {
      const subjRes = await pool.query("SELECT grade_id FROM subject WHERE subject_id = $1", [subject_id]);
      if (subjRes.rows.length > 0) targetGradeId = subjRes.rows[0].grade_id;
    }

    if (!targetSubjectId && targetGradeId) {
      const subjRes = await pool.query("SELECT subject_id FROM subject WHERE grade_id = $1 LIMIT 1", [targetGradeId]);
      if (subjRes.rows.length > 0) targetSubjectId = subjRes.rows[0].subject_id;
    }

    // Permission Enforcement: Only Class In-Charge teacher can take/modify attendance
    const isInCharge = teacher.incharge_grade_id && (teacher.incharge_grade_id === targetGradeId || teacher.incharge_grade_id === grade_id);
    
    if (!isInCharge && req.user.role !== "admin") {
      return res.status(403).json({
        success: false,
        message: `Access Denied: You are not the Class In-Charge teacher for class ${targetGradeId || 'selected'}. You can only view attendance for your teaching subjects.`
      });
    }

    for (const rec of records) {
      const studentId = rec.student_id;
      const status = rec.status || "Present";
      const reason = rec.reason || "";
      const effectiveSubId = targetSubjectId || "GEN_ATT";

      await pool.query(
        `INSERT INTO attendance (student_id, subject_id, date, status, reason, marked_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (student_id, subject_id, date)
         DO UPDATE SET 
           status = EXCLUDED.status,
           reason = EXCLUDED.reason,
           marked_by = EXCLUDED.marked_by,
           created_at = NOW()`,
        [studentId, effectiveSubId, date, status, reason, teacher.teacher_id]
      );
    }

    res.json({ success: true, message: "Attendance marked successfully by Class In-Charge teacher" });
  } catch (err) {
    console.error("Error marking attendance:", err);
    res.status(500).json({ success: false, message: "Failed to mark attendance: " + err.message });
  }
});

// 3. GET /api/teacher-attendance-view - Class roster joined with existing attendance on date
app.get("/api/teacher-attendance-view", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { subject_id, grade_id, date } = req.query;
  if ((!subject_id && !grade_id) || !date) {
    return res.status(400).json({ success: false, message: "subject_id or grade_id and date are required" });
  }

  try {
    const teacher = await resolveTeacherId(req);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher not found" });

    let targetGradeId = grade_id;
    if (subject_id && !targetGradeId) {
      const subjRes = await pool.query("SELECT grade_id FROM subject WHERE subject_id = $1", [subject_id]);
      if (subjRes.rows.length > 0) targetGradeId = subjRes.rows[0].grade_id;
    }

    const canEdit = !!(teacher.incharge_grade_id && (teacher.incharge_grade_id === targetGradeId || teacher.incharge_grade_id === grade_id));

    let query;
    let params;

    if (subject_id) {
      query = `SELECT 
        s.student_id,
        s.student_reg_no,
        s.student_name,
        COALESCE(a.status, 'Present') AS status,
        COALESCE(a.reason, '') AS reason,
        a.created_at AS marked_at,
        t.teacher_name AS marked_by_teacher
      FROM enrolled_subjects es
      JOIN student s ON es.student_id = s.student_id
      LEFT JOIN attendance a ON a.student_id = s.student_id AND (a.subject_id = es.subject_id OR a.subject_id = $1) AND a.date = $2::date
      LEFT JOIN teacher t ON a.marked_by = t.teacher_id
      WHERE es.subject_id = $1
      ORDER BY s.student_name ASC`;
      params = [subject_id, date];
    } else {
      query = `SELECT 
        s.student_id,
        s.student_reg_no,
        s.student_name,
        COALESCE(a.status, 'Present') AS status,
        COALESCE(a.reason, '') AS reason,
        a.created_at AS marked_at,
        t.teacher_name AS marked_by_teacher
      FROM student s
      LEFT JOIN attendance a ON a.student_id = s.student_id AND a.date = $2::date
      LEFT JOIN teacher t ON a.marked_by = t.teacher_id
      WHERE s.grade_id = $1
      ORDER BY s.student_name ASC`;
      params = [targetGradeId, date];
    }

    const result = await pool.query(query, params);

    res.json({
      success: true,
      can_edit: canEdit,
      incharge_grade_id: teacher.incharge_grade_id,
      incharge_grade_name: teacher.incharge_grade_name,
      target_grade_id: targetGradeId,
      records: result.rows
    });
  } catch (err) {
    console.error("Error viewing attendance:", err);
    res.status(500).json({ success: false, message: "Failed to load attendance view" });
  }
});

// 4. POST /api/create-assignment - Create assignment for subject
app.post("/api/create-assignment", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { subject_id, title, description, due_date, max_marks } = req.body;
  if (!subject_id || !title || !due_date) {
    return res.status(400).json({ success: false, message: "subject_id, title, and due_date are required" });
  }

  try {
    const teacher = await resolveTeacherId(req);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher account not found" });

    const maxMarksVal = parseInt(max_marks, 10) || 100;

    const result = await pool.query(
      `INSERT INTO assignment (subject_id, teacher_id, title, description, due_date, max_marks, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [subject_id, teacher.teacher_id, title, description || "", due_date, maxMarksVal]
    );

    res.json({ success: true, message: "Assignment created successfully", assignment: result.rows[0] });
  } catch (err) {
    console.error("Error creating assignment:", err);
    res.status(500).json({ success: false, message: "Failed to create assignment: " + err.message });
  }
});

// 5. GET /api/teacher-assignments - List teacher assignments with submission counts
app.get("/api/teacher-assignments", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { subject_id } = req.query;

  try {
    const teacher = await resolveTeacherId(req);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher account not found" });

    let query = `
      SELECT 
        a.assignment_id,
        a.subject_id,
        s.subject_name,
        a.title,
        a.description,
        a.due_date,
        a.max_marks,
        a.created_at,
        COUNT(sub.submission_id)::int AS submission_count,
        COUNT(sub.submission_id) FILTER (WHERE sub.marks IS NULL)::int AS ungraded_count
      FROM assignment a
      JOIN subject s ON a.subject_id = s.subject_id
      LEFT JOIN submission sub ON a.assignment_id = sub.assignment_id
      WHERE a.teacher_id = $1
    `;
    const params = [teacher.teacher_id];

    if (subject_id) {
      params.push(subject_id);
      query += ` AND a.subject_id = $2`;
    }

    query += ` GROUP BY a.assignment_id, s.subject_name ORDER BY a.created_at DESC`;

    const result = await pool.query(query, params);

    res.json({ success: true, assignments: result.rows });
  } catch (err) {
    console.error("Error fetching teacher assignments:", err);
    res.status(500).json({ success: false, message: "Failed to load assignments" });
  }
});

// 6. GET /api/assignment-submissions/:assignment_id - Student submissions for grading
app.get("/api/assignment-submissions/:assignment_id", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { assignment_id } = req.params;

  try {
    const result = await pool.query(
      `SELECT 
        sub.submission_id,
        sub.assignment_id,
        sub.student_id,
        s.student_reg_no,
        s.student_name,
        s.email,
        sub.file_url,
        sub.submitted_at,
        sub.marks,
        sub.feedback,
        sub.graded_at,
        a.title AS assignment_title,
        a.max_marks
      FROM submission sub
      JOIN student s ON sub.student_id = s.student_id
      JOIN assignment a ON sub.assignment_id = a.assignment_id
      WHERE sub.assignment_id = $1
      ORDER BY sub.submitted_at DESC`,
      [assignment_id]
    );

    res.json({ success: true, submissions: result.rows });
  } catch (err) {
    console.error("Error fetching submissions:", err);
    res.status(500).json({ success: false, message: "Failed to load submissions" });
  }
});

// 7. POST /api/grade-submission - Grade individual submission
app.post("/api/grade-submission", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { submission_id, marks, feedback } = req.body;
  if (!submission_id || marks === undefined) {
    return res.status(400).json({ success: false, message: "submission_id and marks are required" });
  }

  try {
    const marksVal = parseInt(marks, 10);
    const result = await pool.query(
      `UPDATE submission 
       SET marks = $1, feedback = $2, graded_at = NOW()
       WHERE submission_id = $3
       RETURNING *`,
      [marksVal, feedback || "", submission_id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    res.json({ success: true, message: "Submission graded successfully", submission: result.rows[0] });
  } catch (err) {
    console.error("Error grading submission:", err);
    res.status(500).json({ success: false, message: "Failed to grade submission: " + err.message });
  }
});

// 8. POST /api/create-announcement - Publish notice
app.post("/api/create-announcement", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { title, message, subject_id, grade_id } = req.body;
  if (!title || !message) {
    return res.status(400).json({ success: false, message: "title and message are required" });
  }

  try {
    const teacher = await resolveTeacherId(req);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher account not found" });

    const result = await pool.query(
      `INSERT INTO announcement (title, message, subject_id, grade_id, created_by, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING *`,
      [title, message, subject_id || null, grade_id || null, teacher.teacher_id]
    );

    res.json({ success: true, message: "Announcement published successfully", announcement: result.rows[0] });
  } catch (err) {
    console.error("Error creating announcement:", err);
    res.status(500).json({ success: false, message: "Failed to create announcement: " + err.message });
  }
});

// 9. GET /api/teacher-announcements - Teacher's past announcements
app.get("/api/teacher-announcements", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const teacher = await resolveTeacherId(req);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher account not found" });

    const result = await pool.query(
      `SELECT 
        a.announcement_id,
        a.title,
        a.message,
        a.subject_id,
        s.subject_name,
        a.grade_id,
        g.grade_name,
        a.created_at
      FROM announcement a
      LEFT JOIN subject s ON a.subject_id = s.subject_id
      LEFT JOIN grade g ON a.grade_id = g.grade_id
      WHERE a.created_by = $1
      ORDER BY a.created_at DESC`,
      [teacher.teacher_id]
    );

    res.json({ success: true, announcements: result.rows });
  } catch (err) {
    console.error("Error fetching teacher announcements:", err);
    res.status(500).json({ success: false, message: "Failed to load announcements" });
  }
});

// 10. POST /api/schedule-exam - Schedule exam date/time
app.post("/api/schedule-exam", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { exam_name, grade_id, subject_id, date, time } = req.body;
  if (!exam_name || !grade_id || !subject_id || !date || !time) {
    return res.status(400).json({ success: false, message: "exam_name, grade_id, subject_id, date, and time are required" });
  }

  try {
    // 1. Get or create exam
    let examRes = await pool.query("SELECT exam_id FROM exam WHERE exam_name = $1 AND grade_id = $2", [exam_name, grade_id]);
    let examId;
    if (examRes.rows.length === 0) {
      const createExam = await pool.query("INSERT INTO exam (exam_name, grade_id) VALUES ($1, $2) RETURNING exam_id", [exam_name, grade_id]);
      examId = createExam.rows[0].exam_id;
    } else {
      examId = examRes.rows[0].exam_id;
    }

    // 2. Insert or update subject_exam
    await pool.query(
      `INSERT INTO subject_exam (exam_id, subject_id, date, time) 
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (exam_id, subject_id) DO UPDATE SET date = EXCLUDED.date, time = EXCLUDED.time`,
      [examId, subject_id, date, time]
    );

    res.json({ success: true, message: "Exam scheduled successfully", exam_id: examId });
  } catch (err) {
    console.error("Error scheduling exam:", err);
    res.status(500).json({ success: false, message: "Failed to schedule exam: " + err.message });
  }
});

// 11. GET /api/teacher-exams - List scheduled exams for teacher's subjects
app.get("/api/teacher-exams", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  try {
    const teacher = await resolveTeacherId(req);
    if (!teacher) return res.status(404).json({ success: false, message: "Teacher account not found" });

    const result = await pool.query(
      `SELECT 
        e.exam_id,
        e.exam_name,
        e.grade_id,
        g.grade_name,
        se.subject_id,
        s.subject_name,
        se.date,
        se.time
      FROM subject_exam se
      JOIN exam e ON se.exam_id = e.exam_id
      JOIN subject s ON se.subject_id = s.subject_id
      LEFT JOIN grade g ON e.grade_id = g.grade_id
      JOIN teacher_subjects ts ON ts.subject_id = se.subject_id
      WHERE ts.teacher_id = $1
      ORDER BY se.date ASC, se.time ASC`,
      [teacher.teacher_id]
    );

    res.json({ success: true, exams: result.rows });
  } catch (err) {
    console.error("Error fetching teacher exams:", err);
    res.status(500).json({ success: false, message: "Failed to load exams" });
  }
});

// 12. POST /api/publish-results - Bulk publish/update student exam results
app.post("/api/publish-results", verifyToken, async (req, res) => {
  if (req.user.role !== "teacher" && req.user.role !== "admin") {
    return res.status(403).json({ success: false, message: "Access denied" });
  }

  const { exam_id, subject_id, results } = req.body;
  if (!exam_id || !subject_id || !Array.isArray(results)) {
    return res.status(400).json({ success: false, message: "exam_id, subject_id, and results array are required" });
  }

  try {
    for (const r of results) {
      const studentId = r.student_id;
      const marksObtained = parseFloat(r.marks_obtained) || 0;
      const maxMarks = parseFloat(r.max_marks) || 100;
      const grade = r.grade || (marksObtained >= 75 ? 'A' : marksObtained >= 65 ? 'B' : marksObtained >= 50 ? 'C' : marksObtained >= 35 ? 'S' : 'F');

      await pool.query(
        `INSERT INTO result (exam_id, subject_id, student_id, marks_obtained, max_marks, grade, published_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())
         ON CONFLICT (exam_id, subject_id, student_id)
         DO UPDATE SET 
           marks_obtained = EXCLUDED.marks_obtained,
           max_marks = EXCLUDED.max_marks,
           grade = EXCLUDED.grade,
           published_at = NOW()`,
        [exam_id, subject_id, studentId, marksObtained, maxMarks, grade]
      );
    }

    res.json({ success: true, message: "Results published successfully" });
  } catch (err) {
    console.error("Error publishing results:", err);
    res.status(500).json({ success: false, message: "Failed to publish results: " + err.message });
  }
});

// ==========================================
// ADMIN PORTAL API ENDPOINTS (FULL STACK)
// ==========================================

// Helper middleware / check for admin role
function requireAdmin(req, res) {
  if (req.user.role !== "admin") {
    res.status(403).json({ success: false, message: "Access denied. Admin role required." });
    return false;
  }
  return true;
}

// 1. Dashboard Summary KPI metrics
app.get("/api/admin/dashboard-summary", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const [studentsCount, teachersCount, subjectsCount, examsCount, recentAnnounce, recentStudents] = await Promise.all([
      pool.query("SELECT COUNT(*) AS total FROM student WHERE is_active IS NOT FALSE"),
      pool.query("SELECT COUNT(*) AS total FROM teacher WHERE is_active IS NOT FALSE"),
      pool.query("SELECT COUNT(*) AS total FROM subject"),
      pool.query("SELECT COUNT(*) AS total FROM subject_exam WHERE date >= CURRENT_DATE"),
      pool.query(`
        SELECT a.announcement_id, a.title, a.message, a.created_at,
               COALESCE(t.teacher_name, 'Administration') AS author
        FROM announcement a
        LEFT JOIN teacher t ON a.created_by = t.teacher_id
        ORDER BY a.created_at DESC LIMIT 5
      `),
      pool.query(`
        SELECT s.student_id, s.student_reg_no, s.student_name, g.grade_name, s.created_at
        FROM student s
        LEFT JOIN grade g ON s.grade_id = g.grade_id
        ORDER BY s.student_id DESC LIMIT 5
      `)
    ]);

    res.json({
      success: true,
      summary: {
        total_students: parseInt(studentsCount.rows[0].total, 10),
        total_teachers: parseInt(teachersCount.rows[0].total, 10),
        total_subjects: parseInt(subjectsCount.rows[0].total, 10),
        upcoming_exams: parseInt(examsCount.rows[0].total, 10),
        recent_announcements: recentAnnounce.rows,
        recent_students: recentStudents.rows
      }
    });
  } catch (err) {
    console.error("Error loading admin dashboard summary:", err);
    res.status(500).json({ success: false, message: "Failed to load dashboard summary" });
  }
});

// 2. User Management - Students
app.get("/api/admin/students", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { grade_id, search, is_active, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  try {
    let whereClauses = [];
    let params = [];

    if (grade_id && grade_id !== "all") {
      params.push(grade_id);
      whereClauses.push(`s.grade_id = $${params.length}`);
    }

    if (search && search.trim() !== "") {
      params.push(`%${search.trim()}%`);
      whereClauses.push(`(s.student_name ILIKE $${params.length} OR s.student_reg_no ILIKE $${params.length} OR s.email ILIKE $${params.length})`);
    }

    if (is_active !== undefined && is_active !== "all") {
      params.push(is_active === "true" || is_active === true);
      whereClauses.push(`COALESCE(s.is_active, true) = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM student s ${whereSql}`, params);
    const totalCount = parseInt(countRes.rows[0].total, 10);

    params.push(parseInt(limit, 10));
    params.push(offset);

    const query = `
      SELECT 
        s.student_id,
        s.student_reg_no,
        s.student_name,
        s.email,
        s.phone_number,
        s.address,
        s.grade_id,
        g.grade_name,
        COALESCE(s.is_active, true) AS is_active,
        s.created_at,
        (SELECT COUNT(*) FROM enrolled_subjects es WHERE es.student_id = s.student_id) AS enrolled_subjects_count
      FROM student s
      LEFT JOIN grade g ON s.grade_id = g.grade_id
      ${whereSql}
      ORDER BY s.student_id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      students: result.rows,
      total: totalCount,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
  } catch (err) {
    console.error("Error fetching students for admin:", err);
    res.status(500).json({ success: false, message: "Failed to fetch students" });
  }
});

// Create student
app.post("/api/admin/students", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { student_name, student_reg_no, email, phone_number, address, password, grade_id } = req.body;
  if (!student_name || !student_reg_no || !email || !password || !grade_id) {
    return res.status(400).json({ success: false, message: "Name, Reg No, Email, Password, and Grade are required" });
  }

  try {
    const existing = await pool.query("SELECT * FROM student WHERE email = $1 OR student_reg_no = $2", [email, student_reg_no]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email or Student Register Number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertRes = await pool.query(
      `INSERT INTO student (student_name, student_reg_no, email, phone_number, address, password, grade_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING student_id, student_reg_no, student_name, email, grade_id`,
      [student_name, student_reg_no, email, phone_number || null, address || null, hashedPassword, grade_id]
    );
    const newStudent = insertRes.rows[0];

    // Automatically enroll in grade's subjects
    const gradeSubjects = await pool.query("SELECT subject_id FROM subject WHERE grade_id = $1", [grade_id]);
    for (const sub of gradeSubjects.rows) {
      await pool.query(
        "INSERT INTO enrolled_subjects (student_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [newStudent.student_id, sub.subject_id]
      );
    }

    res.json({ success: true, message: "Student created successfully", student: newStudent });
  } catch (err) {
    console.error("Error creating student:", err);
    res.status(500).json({ success: false, message: "Failed to create student: " + err.message });
  }
});

// Update student
app.put("/api/admin/students/:id", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const studentId = req.params.id;
  const { student_name, email, phone_number, address, grade_id, is_active, password } = req.body;

  try {
    let query = `
      UPDATE student 
      SET student_name = COALESCE($1, student_name),
          email = COALESCE($2, email),
          phone_number = COALESCE($3, phone_number),
          address = COALESCE($4, address),
          grade_id = COALESCE($5, grade_id),
          is_active = COALESCE($6, is_active)
    `;
    let params = [
      student_name || null,
      email || null,
      phone_number || null,
      address || null,
      grade_id || null,
      is_active !== undefined ? is_active : null
    ];

    if (password && password.trim().length >= 6) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      params.push(hashedPassword);
      query += `, password = $${params.length}`;
    }

    params.push(studentId);
    query += ` WHERE student_id::text = $${params.length} OR student_reg_no = $${params.length} RETURNING *`;

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Student not found" });
    }

    res.json({ success: true, message: "Student updated successfully", student: result.rows[0] });
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ success: false, message: "Failed to update student: " + err.message });
  }
});

// Toggle deactivate / activate student
app.delete("/api/admin/students/:id", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const studentId = req.params.id;
  try {
    const check = await pool.query("SELECT is_active FROM student WHERE student_id::text = $1 OR student_reg_no = $1", [studentId]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Student not found" });

    const newStatus = !(check.rows[0].is_active !== false);
    await pool.query("UPDATE student SET is_active = $1 WHERE student_id::text = $2 OR student_reg_no = $2", [newStatus, studentId]);

    res.json({ success: true, message: `Student status updated to ${newStatus ? 'Active' : 'Deactivated'}`, is_active: newStatus });
  } catch (err) {
    console.error("Error deactivating student:", err);
    res.status(500).json({ success: false, message: "Failed to toggle status" });
  }
});

// 3. User Management - Teachers
app.get("/api/admin/teachers", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { search, is_active, page = 1, limit = 50 } = req.query;
  const offset = (parseInt(page, 10) - 1) * parseInt(limit, 10);

  try {
    let whereClauses = [];
    let params = [];

    if (search && search.trim() !== "") {
      params.push(`%${search.trim()}%`);
      whereClauses.push(`(t.teacher_name ILIKE $${params.length} OR t.teacher_reg_no ILIKE $${params.length} OR t.email ILIKE $${params.length})`);
    }

    if (is_active !== undefined && is_active !== "all") {
      params.push(is_active === "true" || is_active === true);
      whereClauses.push(`COALESCE(t.is_active, true) = $${params.length}`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const countRes = await pool.query(`SELECT COUNT(*) as total FROM teacher t ${whereSql}`, params);
    const totalCount = parseInt(countRes.rows[0].total, 10);

    params.push(parseInt(limit, 10));
    params.push(offset);

    const query = `
      SELECT 
        t.teacher_id,
        t.teacher_reg_no,
        t.teacher_name,
        t.email,
        t.phone_number,
        t.address,
        t.incharge_grade_id,
        g.grade_name AS incharge_grade_name,
        COALESCE(t.is_active, true) AS is_active,
        COALESCE(json_agg(DISTINCT jsonb_build_object('subject_id', s.subject_id, 'subject_name', s.subject_name, 'grade_name', sg.grade_name, 'grade_id', s.grade_id)) FILTER (WHERE s.subject_id IS NOT NULL), '[]') AS assigned_subjects
      FROM teacher t
      LEFT JOIN grade g ON t.incharge_grade_id = g.grade_id
      LEFT JOIN teacher_subjects ts ON t.teacher_id = ts.teacher_id
      LEFT JOIN subject s ON ts.subject_id = s.subject_id
      LEFT JOIN grade sg ON s.grade_id = sg.grade_id
      ${whereSql}
      GROUP BY t.teacher_id, g.grade_name
      ORDER BY t.teacher_id DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await pool.query(query, params);

    res.json({
      success: true,
      teachers: result.rows,
      total: totalCount,
      page: parseInt(page, 10),
      limit: parseInt(limit, 10)
    });
  } catch (err) {
    console.error("Error fetching teachers for admin:", err);
    res.status(500).json({ success: false, message: "Failed to fetch teachers" });
  }
});

// Create teacher
app.post("/api/admin/teachers", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { teacher_name, teacher_reg_no, email, phone_number, address, password, incharge_grade_id, teachingSubjects } = req.body;
  if (!teacher_name || !teacher_reg_no || !email || !password) {
    return res.status(400).json({ success: false, message: "Name, Reg No, Email, and Password are required" });
  }

  try {
    const existing = await pool.query("SELECT * FROM teacher WHERE email = $1 OR teacher_reg_no = $2", [email, teacher_reg_no]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: "Email or Teacher Register Number already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const insertRes = await pool.query(
      `INSERT INTO teacher (teacher_name, teacher_reg_no, email, phone_number, address, password, incharge_grade_id, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, true)
       RETURNING teacher_id, teacher_reg_no, teacher_name, email`,
      [teacher_name, teacher_reg_no, email, phone_number || null, address || null, hashedPassword, incharge_grade_id || null]
    );
    const newTeacher = insertRes.rows[0];

    if (Array.isArray(teachingSubjects)) {
      for (const subId of teachingSubjects) {
        await pool.query(
          "INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [newTeacher.teacher_id, subId]
        );
      }
    }

    res.json({ success: true, message: "Teacher created successfully", teacher: newTeacher });
  } catch (err) {
    console.error("Error creating teacher:", err);
    res.status(500).json({ success: false, message: "Failed to create teacher: " + err.message });
  }
});

// Update teacher
app.put("/api/admin/teachers/:id", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const teacherId = req.params.id;
  const { teacher_name, email, phone_number, address, incharge_grade_id, is_active, password, teachingSubjects } = req.body;

  try {
    let query = `
      UPDATE teacher 
      SET teacher_name = COALESCE($1, teacher_name),
          email = COALESCE($2, email),
          phone_number = COALESCE($3, phone_number),
          address = COALESCE($4, address),
          incharge_grade_id = $5,
          is_active = COALESCE($6, is_active)
    `;
    let params = [
      teacher_name || null,
      email || null,
      phone_number || null,
      address || null,
      incharge_grade_id !== undefined ? incharge_grade_id : null,
      is_active !== undefined ? is_active : null
    ];

    if (password && password.trim().length >= 6) {
      const hashedPassword = await bcrypt.hash(password.trim(), 10);
      params.push(hashedPassword);
      query += `, password = $${params.length}`;
    }

    params.push(teacherId);
    query += ` WHERE teacher_id::text = $${params.length} OR teacher_reg_no = $${params.length} RETURNING *`;

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: "Teacher not found" });
    }

    const updatedTeacher = result.rows[0];

    // If teachingSubjects array provided, sync
    if (Array.isArray(teachingSubjects)) {
      await pool.query("DELETE FROM teacher_subjects WHERE teacher_id = $1", [updatedTeacher.teacher_id]);
      for (const subId of teachingSubjects) {
        await pool.query(
          "INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
          [updatedTeacher.teacher_id, subId]
        );
      }
    }

    res.json({ success: true, message: "Teacher updated successfully", teacher: updatedTeacher });
  } catch (err) {
    console.error("Error updating teacher:", err);
    res.status(500).json({ success: false, message: "Failed to update teacher: " + err.message });
  }
});

// Toggle deactivate / activate teacher
app.delete("/api/admin/teachers/:id", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const teacherId = req.params.id;
  try {
    const check = await pool.query("SELECT is_active FROM teacher WHERE teacher_id::text = $1 OR teacher_reg_no = $1", [teacherId]);
    if (check.rows.length === 0) return res.status(404).json({ success: false, message: "Teacher not found" });

    const newStatus = !(check.rows[0].is_active !== false);
    await pool.query("UPDATE teacher SET is_active = $1 WHERE teacher_id::text = $2 OR teacher_reg_no = $2", [newStatus, teacherId]);

    res.json({ success: true, message: `Teacher status updated to ${newStatus ? 'Active' : 'Deactivated'}`, is_active: newStatus });
  } catch (err) {
    console.error("Error deactivating teacher:", err);
    res.status(500).json({ success: false, message: "Failed to toggle status" });
  }
});

// 4. Course & Class Management - Subjects & Classes
app.get("/api/admin/subjects", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { grade_id, search } = req.query;
  try {
    let whereClauses = [];
    let params = [];

    if (grade_id && grade_id !== "all") {
      params.push(grade_id);
      whereClauses.push(`s.grade_id = $${params.length}`);
    }

    if (search && search.trim() !== "") {
      params.push(`%${search.trim()}%`);
      whereClauses.push(`(s.subject_name ILIKE $${params.length} OR s.subject_id ILIKE $${params.length})`);
    }

    const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(" AND ")}` : "";

    const query = `
      SELECT 
        s.subject_id,
        s.subject_name,
        s.grade_id,
        g.grade_name,
        COALESCE(json_agg(DISTINCT jsonb_build_object('teacher_id', t.teacher_id, 'teacher_name', t.teacher_name, 'teacher_reg_no', t.teacher_reg_no, 'email', t.email)) FILTER (WHERE t.teacher_id IS NOT NULL), '[]') AS teachers,
        (SELECT COUNT(*) FROM enrolled_subjects es WHERE es.subject_id = s.subject_id) AS enrolled_count,
        (SELECT COUNT(*) FROM course_materials cm WHERE cm.subject_id = s.subject_id) AS materials_count,
        (SELECT COUNT(*) FROM assignment a WHERE a.subject_id = s.subject_id) AS assignments_count
      FROM subject s
      LEFT JOIN grade g ON s.grade_id = g.grade_id
      LEFT JOIN teacher_subjects ts ON s.subject_id = ts.subject_id
      LEFT JOIN teacher t ON ts.teacher_id = t.teacher_id
      ${whereSql}
      GROUP BY s.subject_id, g.grade_name, g.grade_id
      ORDER BY g.grade_id ASC, s.subject_name ASC
    `;

    const result = await pool.query(query, params);
    res.json({ success: true, subjects: result.rows });
  } catch (err) {
    console.error("Error fetching subjects for admin:", err);
    res.status(500).json({ success: false, message: "Failed to load subjects" });
  }
});

// Create Subject
app.post("/api/admin/subjects", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { subject_id, subject_name, grade_id, teacher_id } = req.body;
  if (!subject_id || !subject_name || !grade_id) {
    return res.status(400).json({ success: false, message: "Subject ID, Subject Name, and Grade ID are required" });
  }

  try {
    const existing = await pool.query("SELECT * FROM subject WHERE subject_id = $1", [subject_id.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ success: false, message: `Subject ID '${subject_id}' already exists` });
    }

    const insertSub = await pool.query(
      "INSERT INTO subject (subject_id, subject_name, grade_id) VALUES ($1, $2, $3) RETURNING *",
      [subject_id.trim(), subject_name.trim(), grade_id]
    );

    if (teacher_id) {
      await pool.query(
        "INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [teacher_id, subject_id.trim()]
      );
    }

    // Auto-enroll active students of that grade
    await pool.query(
      `INSERT INTO enrolled_subjects (student_id, subject_id)
       SELECT student_id, $1 FROM student WHERE grade_id = $2
       ON CONFLICT DO NOTHING`,
      [subject_id.trim(), grade_id]
    );

    res.json({ success: true, message: "Subject created successfully", subject: insertSub.rows[0] });
  } catch (err) {
    console.error("Error creating subject:", err);
    res.status(500).json({ success: false, message: "Failed to create subject: " + err.message });
  }
});

// Assign Teacher to Subject
app.post("/api/admin/assign-teacher", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { teacher_id, subject_id } = req.body;
  if (!teacher_id || !subject_id) {
    return res.status(400).json({ success: false, message: "teacher_id and subject_id are required" });
  }

  try {
    await pool.query(
      "INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING",
      [teacher_id, subject_id]
    );
    res.json({ success: true, message: "Teacher assigned to subject successfully" });
  } catch (err) {
    console.error("Error assigning teacher:", err);
    res.status(500).json({ success: false, message: "Failed to assign teacher" });
  }
});

// Unassign Teacher from Subject
app.post("/api/admin/unassign-teacher", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { teacher_id, subject_id } = req.body;
  if (!teacher_id || !subject_id) {
    return res.status(400).json({ success: false, message: "teacher_id and subject_id are required" });
  }

  try {
    await pool.query(
      "DELETE FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2",
      [teacher_id, subject_id]
    );
    res.json({ success: true, message: "Teacher unassigned from subject" });
  } catch (err) {
    console.error("Error unassigning teacher:", err);
    res.status(500).json({ success: false, message: "Failed to unassign teacher" });
  }
});

// Sections / Grades Management
app.get("/api/admin/sections", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const result = await pool.query(`
      SELECT 
        g.grade_id,
        g.grade_name,
        (SELECT COUNT(*) FROM student s WHERE s.grade_id = g.grade_id AND s.is_active IS NOT FALSE) AS student_count,
        (SELECT COUNT(*) FROM subject sub WHERE sub.grade_id = g.grade_id) AS subject_count,
        (SELECT teacher_name FROM teacher t WHERE t.incharge_grade_id = g.grade_id LIMIT 1) AS incharge_teacher
      FROM grade g
      ORDER BY g.grade_id ASC
    `);
    res.json({ success: true, sections: result.rows });
  } catch (err) {
    console.error("Error fetching sections:", err);
    res.status(500).json({ success: false, message: "Failed to load sections" });
  }
});

app.post("/api/admin/sections", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { grade_id, grade_name } = req.body;
  if (!grade_id || !grade_name) {
    return res.status(400).json({ success: false, message: "Grade ID and Grade Name are required" });
  }

  try {
    const result = await pool.query(
      "INSERT INTO grade (grade_id, grade_name) VALUES ($1, $2) ON CONFLICT (grade_id) DO UPDATE SET grade_name = EXCLUDED.grade_name RETURNING *",
      [grade_id.trim(), grade_name.trim()]
    );
    res.json({ success: true, message: "Class / Grade section created successfully", section: result.rows[0] });
  } catch (err) {
    console.error("Error saving section:", err);
    res.status(500).json({ success: false, message: "Failed to save section: " + err.message });
  }
});

// 5. Reports & Analytics Endpoints
app.get("/api/admin/reports/enrollment", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const gradeEnrollment = await pool.query(`
      SELECT g.grade_id, g.grade_name, COUNT(s.student_id) AS student_count
      FROM grade g
      LEFT JOIN student s ON g.grade_id = s.grade_id AND s.is_active IS NOT FALSE
      GROUP BY g.grade_id, g.grade_name
      ORDER BY g.grade_id ASC
    `);

    const subjectEnrollment = await pool.query(`
      SELECT s.subject_id, s.subject_name, g.grade_name, COUNT(es.student_id) AS student_count
      FROM subject s
      LEFT JOIN grade g ON s.grade_id = g.grade_id
      LEFT JOIN enrolled_subjects es ON s.subject_id = es.subject_id
      GROUP BY s.subject_id, s.subject_name, g.grade_name
      ORDER BY student_count DESC LIMIT 20
    `);

    res.json({
      success: true,
      by_grade: gradeEnrollment.rows,
      by_subject: subjectEnrollment.rows
    });
  } catch (err) {
    console.error("Error loading enrollment report:", err);
    res.status(500).json({ success: false, message: "Failed to load enrollment report" });
  }
});

app.get("/api/admin/reports/attendance", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { from_date, to_date } = req.query;

  try {
    let dateFilter = "";
    let params = [];
    if (from_date && to_date) {
      params.push(from_date, to_date);
      dateFilter = "WHERE a.date >= $1 AND a.date <= $2";
    }

    const stats = await pool.query(`
      SELECT 
        COUNT(*) AS total_records,
        COUNT(*) FILTER (WHERE a.status = 'Present') AS present_count,
        COUNT(*) FILTER (WHERE a.status = 'Absent') AS absent_count,
        COUNT(*) FILTER (WHERE a.status = 'Late') AS late_count,
        ROUND((COUNT(*) FILTER (WHERE a.status = 'Present')::decimal / NULLIF(COUNT(*), 0) * 100), 1) AS overall_rate
      FROM attendance a
      ${dateFilter}
    `, params);

    const gradeBreakdown = await pool.query(`
      SELECT 
        g.grade_id,
        g.grade_name,
        COUNT(a.attendance_id) AS total_records,
        COUNT(a.attendance_id) FILTER (WHERE a.status = 'Present') AS present_count,
        ROUND((COUNT(a.attendance_id) FILTER (WHERE a.status = 'Present')::decimal / NULLIF(COUNT(a.attendance_id), 0) * 100), 1) AS attendance_rate
      FROM grade g
      LEFT JOIN student s ON g.grade_id = s.grade_id
      LEFT JOIN attendance a ON s.student_id = a.student_id
      GROUP BY g.grade_id, g.grade_name
      ORDER BY g.grade_id ASC
    `);

    const dailyTrends = await pool.query(`
      SELECT 
        a.date,
        COUNT(a.attendance_id) AS total,
        COUNT(a.attendance_id) FILTER (WHERE a.status = 'Present') AS present,
        COUNT(a.attendance_id) FILTER (WHERE a.status = 'Absent') AS absent,
        COUNT(a.attendance_id) FILTER (WHERE a.status = 'Late') AS late,
        ROUND((COUNT(a.attendance_id) FILTER (WHERE a.status = 'Present')::decimal / NULLIF(COUNT(a.attendance_id), 0) * 100), 1) AS rate
      FROM attendance a
      GROUP BY a.date
      ORDER BY a.date ASC
      LIMIT 30
    `);

    res.json({
      success: true,
      overall: stats.rows[0] || {},
      by_grade: gradeBreakdown.rows,
      daily_trends: dailyTrends.rows
    });
  } catch (err) {
    console.error("Error loading attendance report:", err);
    res.status(500).json({ success: false, message: "Failed to load attendance report" });
  }
});

app.get("/api/admin/reports/results", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const summary = await pool.query(`
      SELECT 
        COUNT(*) AS total_results,
        ROUND(AVG(r.marks_obtained), 1) AS average_score,
        COUNT(*) FILTER (WHERE r.marks_obtained >= 40) AS pass_count,
        COUNT(*) FILTER (WHERE r.marks_obtained < 40) AS fail_count,
        ROUND((COUNT(*) FILTER (WHERE r.marks_obtained >= 40)::decimal / NULLIF(COUNT(*), 0) * 100), 1) AS pass_rate
      FROM result r
    `);

    const bySubject = await pool.query(`
      SELECT 
        s.subject_id,
        s.subject_name,
        g.grade_name,
        COUNT(r.result_id) AS candidates,
        ROUND(AVG(r.marks_obtained), 1) AS avg_mark,
        MAX(r.marks_obtained) AS highest_mark,
        MIN(r.marks_obtained) AS lowest_mark,
        ROUND((COUNT(*) FILTER (WHERE r.marks_obtained >= 40)::decimal / NULLIF(COUNT(r.result_id), 0) * 100), 1) AS pass_rate
      FROM subject s
      LEFT JOIN grade g ON s.grade_id = g.grade_id
      LEFT JOIN result r ON s.subject_id = r.subject_id
      GROUP BY s.subject_id, s.subject_name, g.grade_name
      HAVING COUNT(r.result_id) > 0
      ORDER BY avg_mark DESC
    `);

    res.json({
      success: true,
      summary: summary.rows[0] || {},
      by_subject: bySubject.rows
    });
  } catch (err) {
    console.error("Error loading results report:", err);
    res.status(500).json({ success: false, message: "Failed to load results report" });
  }
});

app.get("/api/admin/reports/course-completion", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM course_materials) AS total_materials,
        (SELECT COUNT(*) FROM assignment) AS total_assignments,
        (SELECT COUNT(*) FROM submission) AS total_submissions,
        (SELECT COUNT(*) FROM submission WHERE marks IS NOT NULL) AS graded_submissions
    `);

    const subjectBreakdown = await pool.query(`
      SELECT 
        s.subject_id,
        s.subject_name,
        g.grade_name,
        (SELECT COUNT(*) FROM course_materials cm WHERE cm.subject_id = s.subject_id) AS materials_count,
        (SELECT COUNT(*) FROM assignment a WHERE a.subject_id = s.subject_id) AS assignments_count,
        (SELECT COUNT(*) FROM submission sub JOIN assignment a ON sub.assignment_id = a.assignment_id WHERE a.subject_id = s.subject_id) AS submissions_count
      FROM subject s
      LEFT JOIN grade g ON s.grade_id = g.grade_id
      ORDER BY materials_count DESC, assignments_count DESC
    `);

    res.json({
      success: true,
      stats: stats.rows[0] || {},
      by_subject: subjectBreakdown.rows
    });
  } catch (err) {
    console.error("Error loading course completion report:", err);
    res.status(500).json({ success: false, message: "Failed to load course completion report" });
  }
});

// 6. System Settings Endpoints
app.get("/api/admin/settings", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  try {
    const result = await pool.query("SELECT key, value, updated_at FROM system_settings ORDER BY key ASC");
    const settingsObj = {};
    result.rows.forEach(r => {
      settingsObj[r.key] = r.value;
    });
    res.json({ success: true, settings: settingsObj });
  } catch (err) {
    console.error("Error fetching system settings:", err);
    res.status(500).json({ success: false, message: "Failed to load system settings" });
  }
});

app.put("/api/admin/settings", verifyToken, async (req, res) => {
  if (!requireAdmin(req, res)) return;

  const { settings } = req.body;
  if (!settings || typeof settings !== 'object') {
    return res.status(400).json({ success: false, message: "Settings object is required" });
  }

  try {
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO system_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)]
      );
    }
    res.json({ success: true, message: "System settings saved successfully" });
  } catch (err) {
    console.error("Error saving system settings:", err);
    res.status(500).json({ success: false, message: "Failed to save system settings: " + err.message });
  }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
