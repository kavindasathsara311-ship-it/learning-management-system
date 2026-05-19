const { Pool } = require("pg");
const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "schoolLMS",
  password: "KAVINDA123",
  port: 5432,
});
async function list() {
  const result = await pool.query("SELECT * FROM teacher LIMIT 5;");
  console.log(result.rows);
  process.exit(0);
}
list();
