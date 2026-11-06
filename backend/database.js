const Database = require("better-sqlite3");
const path = require("path");

// Create or connect to the existing SQLite database
const dbPath = path.join(__dirname, "database.sqlite");
const db = new Database(dbPath);

// Enable database settings
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// ========================================
// USERS TABLE
// ========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
    specialization TEXT,
    qualification TEXT,
    experience INTEGER DEFAULT 0,
    consultation_fee INTEGER DEFAULT 0,
    hospital TEXT,
    bio TEXT,
    availability TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ========================================
// APPOINTMENTS TABLE
// ========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    appointment_date TEXT NOT NULL,
    appointment_time TEXT NOT NULL,
    symptoms TEXT,
    status TEXT DEFAULT 'Pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
  )
`);

// ========================================
// CONSULTATION RECORDS TABLE
// ========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS consultation_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL UNIQUE,
    patient_id INTEGER NOT NULL,
    doctor_id INTEGER NOT NULL,
    diagnosis TEXT,
    prescription TEXT,
    doctor_notes TEXT,
    follow_up_date TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (appointment_id) REFERENCES appointments(id),
    FOREIGN KEY (patient_id) REFERENCES users(id),
    FOREIGN KEY (doctor_id) REFERENCES users(id)
  )
`);

// ========================================
// MIGRATION HELPER
// ========================================

function addColumnIfMissing(tableName, columnName, definition) {
  const columns = db
    .prepare(`PRAGMA table_info(${tableName})`)
    .all();

  const columnExists = columns.some(
    (column) => column.name === columnName
  );

  if (!columnExists) {
    db.exec(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
    );
  }
}

// ========================================
// ROLE CHECK & ADMIN MIGRATION
// ========================================

(function migrateUsersRoleConstraint() {
  try {
    const tableInfo = db
      .prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='users'")
      .get();
    if (tableInfo && tableInfo.sql && !tableInfo.sql.includes("'admin'")) {
      console.log("Migrating users table to support admin role...");
      db.pragma("foreign_keys = OFF");
      db.exec("BEGIN TRANSACTION");
      db.exec(`
        CREATE TABLE users_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          role TEXT NOT NULL CHECK(role IN ('patient', 'doctor', 'admin')),
          specialization TEXT,
          qualification TEXT,
          experience INTEGER DEFAULT 0,
          consultation_fee INTEGER DEFAULT 0,
          hospital TEXT,
          bio TEXT,
          availability TEXT,
          medical_license TEXT,
          verification_status TEXT DEFAULT 'Pending',
          admin_notes TEXT,
          verified_at TEXT,
          verified_by INTEGER,
          age INTEGER,
          gender TEXT,
          blood_group TEXT,
          height REAL,
          weight REAL,
          allergies TEXT,
          chronic_conditions TEXT,
          current_medications TEXT,
          past_surgeries TEXT,
          emergency_contact_name TEXT,
          emergency_contact_phone TEXT,
          emergency_contact_relation TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);
      db.exec(`
        INSERT INTO users_new (
          id, name, email, password, role,
          specialization, qualification, experience, consultation_fee, hospital, bio, availability,
          medical_license, verification_status,
          age, gender, blood_group, height, weight, allergies, chronic_conditions, current_medications, past_surgeries,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relation, created_at
        )
        SELECT
          id, name, email, password, role,
          specialization, qualification, experience, consultation_fee, hospital, bio, availability,
          medical_license, verification_status,
          age, gender, blood_group, height, weight, allergies, chronic_conditions, current_medications, past_surgeries,
          emergency_contact_name, emergency_contact_phone, emergency_contact_relation, created_at
        FROM users
      `);
      db.exec("DROP TABLE users");
      db.exec("ALTER TABLE users_new RENAME TO users");
      db.exec("COMMIT");
      db.pragma("foreign_keys = ON");
      console.log("Users table successfully migrated to support admin role.");
    }
  } catch (err) {
    console.error("Migration error for users table:", err.message);
    try {
      db.exec("ROLLBACK");
    } catch (_) {}
    db.pragma("foreign_keys = ON");
  }
})();

// ========================================
// USERS TABLE MIGRATIONS
// ========================================

addColumnIfMissing("users", "specialization", "TEXT");
addColumnIfMissing("users", "qualification", "TEXT");
addColumnIfMissing("users", "experience", "INTEGER DEFAULT 0");
addColumnIfMissing("users", "consultation_fee", "INTEGER DEFAULT 0");
addColumnIfMissing("users", "hospital", "TEXT");
addColumnIfMissing("users", "bio", "TEXT");
addColumnIfMissing("users", "availability", "TEXT");
addColumnIfMissing("users", "medical_license", "TEXT");
addColumnIfMissing("users", "verification_status", "TEXT DEFAULT 'Pending'");
addColumnIfMissing("users", "admin_notes", "TEXT");
addColumnIfMissing("users", "verified_at", "TEXT");
addColumnIfMissing("users", "verified_by", "INTEGER");

// ========================================
// DOCTOR QUALIFICATION DOCUMENTS TABLE
// ========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS doctor_documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    doctor_id INTEGER NOT NULL,
    document_name TEXT NOT NULL,
    document_type TEXT NOT NULL,
    issuer TEXT,
    issue_year TEXT,
    file_url TEXT NOT NULL,
    file_name TEXT,
    status TEXT DEFAULT 'Pending',
    admin_notes TEXT,
    reviewed_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_doctor_documents
  ON doctor_documents(doctor_id)
`);

addColumnIfMissing("doctor_documents", "admin_notes", "TEXT");
addColumnIfMissing("doctor_documents", "reviewed_at", "TEXT");

// Patient Profile Fields
addColumnIfMissing("users", "age", "INTEGER");
addColumnIfMissing("users", "gender", "TEXT");
addColumnIfMissing("users", "blood_group", "TEXT");
addColumnIfMissing("users", "height", "REAL");
addColumnIfMissing("users", "weight", "REAL");
addColumnIfMissing("users", "allergies", "TEXT");
addColumnIfMissing("users", "chronic_conditions", "TEXT");
addColumnIfMissing("users", "current_medications", "TEXT");
addColumnIfMissing("users", "past_surgeries", "TEXT");
addColumnIfMissing("users", "emergency_contact_name", "TEXT");
addColumnIfMissing("users", "emergency_contact_phone", "TEXT");
addColumnIfMissing("users", "emergency_contact_relation", "TEXT");

// ========================================
// APPOINTMENTS TABLE MIGRATIONS
// ========================================

addColumnIfMissing(
  "appointments",
  "consultation_mode",
  "TEXT DEFAULT 'Offline'"
);

addColumnIfMissing(
  "appointments",
  "meeting_link",
  "TEXT"
);

addColumnIfMissing(
  "appointments",
  "consultation_started_at",
  "TEXT"
);

addColumnIfMissing(
  "appointments",
  "consultation_ended_at",
  "TEXT"
);

// ========================================
// APPOINTMENT HISTORY VISIBILITY
// ========================================

addColumnIfMissing(
  "appointments",
  "patient_hidden",
  "INTEGER NOT NULL DEFAULT 0"
);

addColumnIfMissing(
  "appointments",
  "doctor_hidden",
  "INTEGER NOT NULL DEFAULT 0"
);

// ========================================
// PAYMENT MIGRATIONS
// ========================================

addColumnIfMissing(
  "appointments",
  "payment_status",
  "TEXT DEFAULT 'Unpaid'"
);

addColumnIfMissing(
  "appointments",
  "payment_amount",
  "INTEGER DEFAULT 0"
);

addColumnIfMissing(
  "appointments",
  "payment_method",
  "TEXT"
);

addColumnIfMissing(
  "appointments",
  "paid_at",
  "TEXT"
);

addColumnIfMissing(
  "appointments",
  "transaction_id",
  "TEXT"
);

// ========================================
// PERSISTENT APPOINTMENT CHAT
// ========================================

db.exec(`
  CREATE TABLE IF NOT EXISTS appointment_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    appointment_id INTEGER NOT NULL,
    sender_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),

    FOREIGN KEY (appointment_id)
      REFERENCES appointments(id),

    FOREIGN KEY (sender_id)
      REFERENCES users(id)
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_appointment_messages
  ON appointment_messages(appointment_id, id)
`);

// ========================================
// INITIAL SEED DATA
// ========================================

function seedInitialDataIfEmpty() {
  try {
    const bcrypt = require("bcryptjs");
    const defaultPassword = bcrypt.hashSync("Doctor123!", 10);
    const adminPassword = bcrypt.hashSync("Admin123!", 10);

    // 0. Seed Admin Account
    const existingAdmin = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("admin@medicare.com");

    if (!existingAdmin) {
      db.prepare(`
        INSERT INTO users (name, email, password, role)
        VALUES (?, ?, ?, 'admin')
      `).run("MediCare+ Administrator", "admin@medicare.com", adminPassword);
      console.log("Seeded Admin account: admin@medicare.com / Admin123!");
    }

    const insertUser = db.prepare(`
      INSERT INTO users (
        name, email, password, role,
        specialization, qualification, experience, consultation_fee,
        hospital, bio, availability, medical_license, verification_status, admin_notes, verified_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertDoc = db.prepare(`
      INSERT INTO doctor_documents (
        doctor_id, document_name, document_type, issuer, issue_year, file_url, file_name, status, admin_notes, reviewed_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Doctor 1: Dr. Raju (Verified)
    const existingRaju = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("raju@medicare.com");

    if (!existingRaju) {
      const docRaju = insertUser.run(
        "Raju",
        "raju@medicare.com",
        defaultPassword,
        "doctor",
        "General Physician",
        "MBBS, MD (General Medicine)",
        12,
        500,
        "City Medical Institute",
        "Senior General Physician with over 12 years of clinical experience in comprehensive primary care, family medicine, and health diagnostics.",
        "Monday - Saturday, 09:00 AM - 05:00 PM",
        "MCI-2014-RAJ-8812",
        "Verified",
        "Credentials authenticated via State Medical Council register.",
        new Date().toISOString()
      );

      insertDoc.run(
        docRaju.lastInsertRowid,
        "MBBS & MD Specialist Degree",
        "Degree Certificate",
        "State University of Health Sciences",
        "2014",
        "sample://dr-raju-degree.pdf",
        "Dr_Raju_MD_Degree.pdf",
        "Verified",
        "Degree confirmed authentic.",
        new Date().toISOString()
      );

      insertDoc.run(
        docRaju.lastInsertRowid,
        "State Medical Council Registration Certificate",
        "Medical License / Registration",
        "State Medical Council & Directorate of Medical Education",
        "2015",
        "sample://dr-raju-license.pdf",
        "Dr_Raju_Medical_License.pdf",
        "Verified",
        "Active registration confirmed.",
        new Date().toISOString()
      );
      console.log("Seeded Dr. Raju successfully");
    }

    // Doctor 2: Dr. Sarah Jenkins (Verified)
    const existingJenkins = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("sarah.jenkins@medicare.com");

    if (!existingJenkins) {
      const doc1 = insertUser.run(
        "Sarah Jenkins",
        "sarah.jenkins@medicare.com",
        defaultPassword,
        "doctor",
        "Cardiology",
        "MBBS, MD (Cardiology), FACC",
        12,
        120,
        "Metro Heart & Vascular Institute",
        "Board-certified Cardiologist with over 12 years of clinical excellence in cardiovascular interventions, preventive cardiology, and hypertension management.",
        "Monday - Friday, 09:00 AM - 05:00 PM",
        "MCI-2012-CRD-8492",
        "Verified",
        "Active board fellowship authenticated.",
        new Date().toISOString()
      );

      insertDoc.run(
        doc1.lastInsertRowid,
        "MBBS & MD Cardiology Specialist Degree",
        "Degree Certificate",
        "Harvard Medical School & Teaching Hospitals",
        "2012",
        "sample://harvard-cardiology-md.pdf",
        "Harvard_MD_Cardiology_Degree.pdf",
        "Verified",
        "Degree authenticated.",
        new Date().toISOString()
      );

      insertDoc.run(
        doc1.lastInsertRowid,
        "State Medical Council License & Board Certification",
        "Medical License / Registration",
        "National Medical Council & Board of Cardiovascular Care",
        "2014",
        "sample://cardio-board-license.pdf",
        "MCI_Cardio_License_8492.pdf",
        "Verified",
        "License active.",
        new Date().toISOString()
      );
    }

    // Doctor 3: Dr. Michael Vance (Verified)
    const existingVance = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("michael.vance@medicare.com");

    if (!existingVance) {
      const doc2 = insertUser.run(
        "Michael Vance",
        "michael.vance@medicare.com",
        defaultPassword,
        "doctor",
        "Neurology",
        "MBBS, DM (Neurology), FAAN",
        9,
        150,
        "Apex Brain & Spine Hospital",
        "Senior Neurologist specializing in neuro-critical care, stroke management, chronic migraines, and sleep neurology disorders.",
        "Tuesday - Saturday, 10:00 AM - 06:00 PM",
        "MCI-2015-NEU-3921",
        "Verified",
        "Neuro board certified.",
        new Date().toISOString()
      );

      insertDoc.run(
        doc2.lastInsertRowid,
        "Doctorate of Medicine (DM Neurology) Certificate",
        "Degree Certificate",
        "Johns Hopkins University School of Medicine",
        "2015",
        "sample://johns-hopkins-neurology-dm.pdf",
        "JohnsHopkins_DM_Neurology.pdf",
        "Verified",
        "Verified credentials.",
        new Date().toISOString()
      );
    }

    // Doctor 4: Dr. Rajesh Kumar (PENDING VERIFICATION - Waiting for Admin Review)
    const existingRajesh = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("rajesh.kumar@medicare.com");

    if (!existingRajesh) {
      const docRajesh = insertUser.run(
        "Rajesh Kumar",
        "rajesh.kumar@medicare.com",
        defaultPassword,
        "doctor",
        "General Surgery",
        "MBBS, MS (General Surgery), FMAS",
        8,
        650,
        "Apollo Multispecialty Hospital",
        "Consultant General & Laparoscopic Surgeon specializing in minimally invasive procedures, hernia repairs, and acute surgical care.",
        "Monday - Friday, 10:00 AM - 04:00 PM",
        "MCI-2018-SUR-7731",
        "Pending",
        "Recently submitted qualification documents. Awaiting admin review.",
        null
      );

      insertDoc.run(
        docRajesh.lastInsertRowid,
        "Master of Surgery (MS General Surgery) Degree",
        "Degree Certificate",
        "All India Institute of Medical Sciences (AIIMS)",
        "2018",
        "sample://aiims-ms-surgery.pdf",
        "AIIMS_MS_Surgery_Degree.pdf",
        "Pending",
        "Uploaded by doctor. Ready for document inspection.",
        null
      );

      insertDoc.run(
        docRajesh.lastInsertRowid,
        "Medical Council Permanent Registration Certificate",
        "Medical License / Registration",
        "National Medical Commission (NMC)",
        "2018",
        "sample://nmc-permanent-reg.pdf",
        "NMC_Permanent_Registration_7731.pdf",
        "Pending",
        "Uploaded by doctor. Ready for verification.",
        null
      );
      console.log("Seeded Pending Doctor: Dr. Rajesh Kumar");
    }

    // Doctor 5: Arthur Vance (FLAGGED AS FRAUD - Imposter Practitioner)
    const existingFraud = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("arthur.fake@medicare.com");

    if (!existingFraud) {
      const docFraud = insertUser.run(
        "Arthur Vance",
        "arthur.fake@medicare.com",
        defaultPassword,
        "doctor",
        "Dermatology & Cosmetology",
        "Self-Styled Holistic Practitioner",
        15,
        1500,
        "Independent Wellness Studio",
        "Offering alternative treatments and unregistered cosmetic remedies.",
        "On Demand",
        "FAKE-REG-0000-INVALID",
        "Fraud",
        "FLAGGED AS FRAUD: Registration certificate submitted is counterfeit. State Medical Council confirmed no practitioner registered under this license serial number. Account suspended for patient protection.",
        new Date().toISOString()
      );

      insertDoc.run(
        docFraud.lastInsertRowid,
        "Unrecognized Holistic Therapy Diploma",
        "Other Credential",
        "Non-Accredited Online Academy",
        "2023",
        "sample://fake-diploma.pdf",
        "Counterfeit_Holistic_Cert.pdf",
        "Rejected",
        "Institution not recognized by Medical Council. Forged seal watermark detected.",
        new Date().toISOString()
      );
      console.log("Seeded Flagged Fraud Doctor: Arthur Vance");
    }

    console.log("Database checked and seeded with admin and verified/pending/fraud doctors.");
  } catch (err) {
    console.error("Error seeding initial data:", err.message);
  }
}

seedInitialDataIfEmpty();

// ========================================
// EXPORT DATABASE
// ========================================

module.exports = db;
