/**
 * Helper script to seed an Admin account into the LMS database.
 * Run via: node scripts/seed-admin.js [email] [password] [name] [reg_no]
 */
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || process.env.PGUSER || 'postgres',
  host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
  database: process.env.DB_NAME || process.env.PGDATABASE || 'schoolLMS',
  password: process.env.DB_PASSWORD || process.env.PGPASSWORD,
  port: parseInt(process.env.DB_PORT || process.env.PGPORT || '5432'),
});

async function seedAdmin() {
  const args = process.argv.slice(2);
  const email = args[0] || 'admin@school.com';
  const password = args[1] || 'admin123';
  const name = args[2] || 'System Administrator';
  const regNo = args[3] || 'ADMIN001';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const names = name.split(' ');
    const firstName = names[0] || 'System';
    const lastName = names.slice(1).join(' ') || 'Admin';

    const result = await pool.query(`
      INSERT INTO public.admin (admin_reg_no, admin_name, first_name, last_name, email, phone_number, password, address)
      VALUES ($1, $2, $3, $4, $5, '+1 800 555 0199', $6, 'Main Administration Office')
      ON CONFLICT (email) DO UPDATE SET
        admin_reg_no = EXCLUDED.admin_reg_no,
        admin_name = EXCLUDED.admin_name,
        password = EXCLUDED.password
      RETURNING admin_id, admin_reg_no, admin_name, email;
    `, [regNo, name, firstName, lastName, email, hashedPassword]);

    console.log("Admin seeded successfully:", result.rows[0]);
  } catch (err) {
    console.error("Failed to seed admin:", err);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
