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
    const result = await pool.query("SELECT subject_id, subject_name FROM subject;");
    console.table(result.rows);
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
