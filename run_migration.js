const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  user: process.env.DB_USER || process.env.PGUSER || "postgres",
  host: process.env.DB_HOST || process.env.PGHOST || "localhost",
  database: process.env.DB_NAME || process.env.PGDATABASE || "schoolLMS",
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || "5432"),
});

async function migrate() {
  try {
    console.log("Dropping unused teacher_subject table if exists...");
    await pool.query("DROP TABLE IF EXISTS teacher_subject CASCADE;");

    console.log("Creating public.attendance table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.attendance (
          attendance_id bigserial PRIMARY KEY,
          student_id bigint NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
          subject_id character varying(8) NOT NULL REFERENCES subject(subject_id) ON DELETE CASCADE,
          date date NOT NULL,
          status character varying(10) NOT NULL CHECK (status IN ('Present','Absent','Late')),
          marked_by bigint REFERENCES teacher(teacher_id),
          created_at timestamptz DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (student_id, subject_id, date)
      );
    `);

    console.log("Creating public.announcement table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.announcement (
          announcement_id bigserial PRIMARY KEY,
          title character varying(100) NOT NULL,
          message text NOT NULL,
          subject_id character varying(8) REFERENCES subject(subject_id) ON DELETE CASCADE,
          grade_id character varying(5) REFERENCES grade(grade_id) ON DELETE CASCADE,
          created_by bigint REFERENCES teacher(teacher_id),
          created_at timestamptz DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Creating public.announcement_read table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.announcement_read (
          announcement_id bigint NOT NULL REFERENCES announcement(announcement_id) ON DELETE CASCADE,
          student_id bigint NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
          read_at timestamptz DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (announcement_id, student_id)
      );
    `);

    console.log("Creating public.assignment table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.assignment (
          assignment_id bigserial PRIMARY KEY,
          subject_id character varying(8) NOT NULL REFERENCES subject(subject_id) ON DELETE CASCADE,
          teacher_id bigint NOT NULL REFERENCES teacher(teacher_id),
          title character varying(100) NOT NULL,
          description text,
          due_date timestamptz NOT NULL,
          max_marks integer NOT NULL DEFAULT 100,
          created_at timestamptz DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Creating public.submission table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.submission (
          submission_id bigserial PRIMARY KEY,
          assignment_id bigint NOT NULL REFERENCES assignment(assignment_id) ON DELETE CASCADE,
          student_id bigint NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
          file_url text,
          submitted_at timestamptz DEFAULT CURRENT_TIMESTAMP,
          marks integer,
          feedback text,
          graded_at timestamptz,
          UNIQUE (assignment_id, student_id)
      );
    `);

    console.log("Creating public.result table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.result (
          result_id bigserial PRIMARY KEY,
          exam_id bigint NOT NULL REFERENCES exam(exam_id) ON DELETE CASCADE,
          subject_id character varying(8) NOT NULL REFERENCES subject(subject_id) ON DELETE CASCADE,
          student_id bigint NOT NULL REFERENCES student(student_id) ON DELETE CASCADE,
          marks_obtained numeric(5,2) NOT NULL,
          max_marks numeric(5,2) NOT NULL DEFAULT 100,
          grade character varying(3),
          published_at timestamptz DEFAULT CURRENT_TIMESTAMP,
          UNIQUE (exam_id, subject_id, student_id)
      );
    `);

    console.log("Seeding sample announcements...");
    await pool.query(`
      INSERT INTO public.announcement (title, message, subject_id, grade_id)
      VALUES 
        ('Mid-Term Exam Schedule Released', 'Please review the updated exam timetable under the Exams section.', NULL, NULL),
        ('Mathematics Practice Problems', 'Chapter 4 Algebra practice exercises have been uploaded.', NULL, NULL)
      ON CONFLICT DO NOTHING;
    `);

    console.log("DB Migration completed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("Migration Error:", err);
    process.exit(1);
  }
}

migrate();
