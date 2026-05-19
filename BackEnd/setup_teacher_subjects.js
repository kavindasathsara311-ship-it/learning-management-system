const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "schoolLMS",
  password: "KAVINDA123",
  port: 5432,
});

async function main() {
  try {
    // 1. Create the new teacher_subjects table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_subjects (
        teacher_id VARCHAR(8) REFERENCES teacher(teacher_reg_no) ON DELETE CASCADE,
        subject_id VARCHAR(10) REFERENCES subject(subject_id) ON DELETE CASCADE,
        PRIMARY KEY (teacher_id, subject_id)
      )
    `);
    
    console.log("Successfully created teacher_subjects table.");

    // Optional: Migrate existing subjects from teacher table if any exist
    await pool.query(`
      INSERT INTO teacher_subjects (teacher_id, subject_id)
      SELECT teacher_reg_no, teacher_subject 
      FROM teacher 
      WHERE teacher_subject IS NOT NULL
      ON CONFLICT DO NOTHING
    `);
    console.log("Successfully migrated existing teacher subjects.");

  } catch (err) {
    console.error("Error setting up DB:", err);
  } finally {
    process.exit(0);
  }
}
main();
