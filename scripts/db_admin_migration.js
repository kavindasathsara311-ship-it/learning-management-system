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

async function runAdminMigration() {
  console.log("=== RUNNING ADMIN DATABASE MIGRATION ===");

  try {
    // 1. Admin Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.admin (
          admin_id bigserial PRIMARY KEY,
          admin_reg_no character varying(50) UNIQUE NOT NULL,
          admin_name character varying(255) NOT NULL,
          first_name character varying(100),
          last_name character varying(100),
          email character varying(255) UNIQUE NOT NULL,
          phone_number character varying(50),
          password text NOT NULL,
          address text DEFAULT 'Main Administration Office',
          profile_picture text DEFAULT 'Resources/Images/default_avatar.png',
          settings jsonb DEFAULT '{"email_notifications": true, "assignment_alerts": true, "exam_notifications": true, "theme": "dark"}'::jsonb,
          created_at timestamptz DEFAULT CURRENT_TIMESTAMP
      );
      ALTER TABLE public.admin ADD COLUMN IF NOT EXISTS first_name character varying(100);
      ALTER TABLE public.admin ADD COLUMN IF NOT EXISTS last_name character varying(100);
      ALTER TABLE public.admin ADD COLUMN IF NOT EXISTS admin_name character varying(255);
      
      ALTER TABLE public.student ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT CURRENT_TIMESTAMP;
      ALTER TABLE public.teacher ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT CURRENT_TIMESTAMP;
      
      ALTER TABLE public.student ALTER COLUMN student_reg_no TYPE character varying(50);
      ALTER TABLE public.teacher ALTER COLUMN teacher_reg_no TYPE character varying(50);
      ALTER TABLE public.subject ALTER COLUMN subject_id TYPE character varying(50);
      ALTER TABLE public.subject ALTER COLUMN subject_name TYPE character varying(255);
      ALTER TABLE public.subject ALTER COLUMN grade_id TYPE character varying(20);
      ALTER TABLE public.grade ALTER COLUMN grade_id TYPE character varying(20);
      ALTER TABLE public.grade ALTER COLUMN grade_name TYPE character varying(255);
      ALTER TABLE public.teacher_subjects ALTER COLUMN subject_id TYPE character varying(50);
      ALTER TABLE public.enrolled_subjects ALTER COLUMN subject_id TYPE character varying(50);
      ALTER TABLE public.result ALTER COLUMN subject_id TYPE character varying(50);
      ALTER TABLE public.subject_exam ALTER COLUMN subject_id TYPE character varying(50);
      ALTER TABLE public.assignment ALTER COLUMN subject_id TYPE character varying(50);
      ALTER TABLE public.course_materials ALTER COLUMN subject_id TYPE character varying(50);
      ALTER TABLE public.announcement ALTER COLUMN subject_id TYPE character varying(50);
    `);
    console.log("[✓] Admin table and column sizes verified.");

    // 2. Soft-delete is_active column on student & teacher
    await pool.query(`
      ALTER TABLE public.student ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
      ALTER TABLE public.teacher ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
    `);
    console.log("[✓] is_active column added to student & teacher tables.");

    // 3. System Settings Table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS public.system_settings (
          key character varying(100) PRIMARY KEY,
          value text NOT NULL,
          updated_at timestamptz DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("[✓] system_settings table verified.");

    // 4. Seed default system settings
    const defaultSettings = [
      { key: 'school_name', value: 'Apex International Academy' },
      { key: 'academic_year', value: '2026-2027' },
      { key: 'current_term', value: 'Term 2' },
      { key: 'term_start_date', value: '2026-05-01' },
      { key: 'term_end_date', value: '2026-09-30' },
      { key: 'school_email', value: 'admin@school.com' },
      { key: 'school_phone', value: '+1 800 555 0199' },
      { key: 'school_address', value: '100 Knowledge Way, Colombo 07' }
    ];

    for (const item of defaultSettings) {
      await pool.query(`
        INSERT INTO public.system_settings (key, value)
        VALUES ($1, $2)
        ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
      `, [item.key, item.value]);
    }
    console.log("[✓] Seeded default system settings.");

    // 5. Seed default admin
    const hashedPassword = await bcrypt.hash("admin123", 10);
    await pool.query(`
      INSERT INTO public.admin (admin_reg_no, admin_name, first_name, last_name, email, phone_number, password, address)
      VALUES ('ADMIN001', 'System Administrator', 'System', 'Administrator', 'admin@school.com', '+1 800 555 0199', $1, 'Main Administration Office')
      ON CONFLICT (email) DO UPDATE SET 
        password = EXCLUDED.password,
        admin_reg_no = EXCLUDED.admin_reg_no;
    `, [hashedPassword]);
    console.log("[✓] Default admin seeded (admin@school.com / admin123).");

    console.log("=== MIGRATION COMPLETED SUCCESSFULLY ===");
  } catch (err) {
    console.error("Migration error:", err);
    process.exit(1);
  }
}

runAdminMigration().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
