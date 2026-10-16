
const Database = require("better-sqlite3");

// Create or connect to the existing SQLite database
const db = new Database("database.sqlite");

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
    role TEXT NOT NULL CHECK(role IN ('patient', 'doctor')),
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
addColumnIfMissing("users", "verification_status", "TEXT DEFAULT 'Verified'");

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
    status TEXT DEFAULT 'Verified',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE
  )
`);

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_doctor_documents
  ON doctor_documents(doctor_id)
`);

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

// Patients and doctors can independently hide appointments
// from their own history without deleting the actual records.

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

// ========================================
// APPOINTMENT CHAT INDEX
// ========================================

db.exec(`
  CREATE INDEX IF NOT EXISTS idx_appointment_messages
  ON appointment_messages(appointment_id, id)
`);

// ========================================
// INITIAL SEED DATA
// ========================================

function seedInitialDataIfEmpty() {
  try {
    const existingJenkins = db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get("sarah.jenkins@medicare.com");

    if (!existingJenkins) {
      const bcrypt = require("bcryptjs");
      const defaultPassword = bcrypt.hashSync("Doctor123!", 10);

      const insertUser = db.prepare(`
        INSERT INTO users (
          name, email, password, role,
          specialization, qualification, experience, consultation_fee,
          hospital, bio, availability, medical_license, verification_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertDoc = db.prepare(`
        INSERT INTO doctor_documents (
          doctor_id, document_name, document_type, issuer, issue_year, file_url, file_name, status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'Verified')
      `);

      // Doctor 1: Dr. Sarah Jenkins
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
        "Verified"
      );

      insertDoc.run(
        doc1.lastInsertRowid,
        "MBBS & MD Cardiology Specialist Degree",
        "Degree Certificate",
        "Harvard Medical School & Teaching Hospitals",
        "2012",
        "sample://harvard-cardiology-md.pdf",
        "Harvard_MD_Cardiology_Degree.pdf"
      );

      insertDoc.run(
        doc1.lastInsertRowid,
        "State Medical Council License & Board Certification",
        "Medical License / Registration",
        "National Medical Council & Board of Cardiovascular Care",
        "2014",
        "sample://cardio-board-license.pdf",
        "MCI_Cardio_License_8492.pdf"
      );

      // Doctor 2: Dr. Michael Vance
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
        "Verified"
      );

      insertDoc.run(
        doc2.lastInsertRowid,
        "Doctorate of Medicine (DM Neurology) Certificate",
        "Degree Certificate",
        "Johns Hopkins University School of Medicine",
        "2015",
        "sample://johns-hopkins-neurology-dm.pdf",
        "JohnsHopkins_DM_Neurology.pdf"
      );

      insertDoc.run(
        doc2.lastInsertRowid,
        "American Academy of Neurology Fellow Accreditation",
        "Fellowship / Specialty Certificate",
        "American Academy of Neurology",
        "2018",
        "sample://aan-fellowship-cert.pdf",
        "AAN_Fellowship_Credential.pdf"
      );

      // Doctor 3: Dr. Emily Chen
      const doc3 = insertUser.run(
        "Emily Chen",
        "emily.chen@medicare.com",
        defaultPassword,
        "doctor",
        "Pediatrics",
        "MBBS, MD (Pediatrics), FAAP",
        8,
        95,
        "St. Jude Children's Wellness Hospital",
        "Passionate pediatric specialist providing comprehensive healthcare from infancy through adolescence, newborn care, and pediatric immunizations.",
        "Monday - Thursday, 08:30 AM - 04:30 PM",
        "MCI-2016-PED-5742",
        "Verified"
      );

      insertDoc.run(
        doc3.lastInsertRowid,
        "MD Pediatrics Specialty Qualification",
        "Degree Certificate",
        "Stanford University School of Medicine",
        "2016",
        "sample://stanford-md-pediatrics.pdf",
        "Stanford_MD_Pediatrics.pdf"
      );

      // Doctor 4: Dr. Raju
      const doc4 = insertUser.run(
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
        "Verified"
      );

      insertDoc.run(
        doc4.lastInsertRowid,
        "MBBS & MD Specialist Degree",
        "Degree Certificate",
        "State University of Health Sciences",
        "2014",
        "sample://dr-raju-degree.pdf",
        "Dr_Raju_MD_Degree.pdf"
      );

      insertDoc.run(
        doc4.lastInsertRowid,
        "State Medical Council Registration Certificate",
        "Medical License / Registration",
        "State Medical Council & Directorate of Medical Education",
        "2015",
        "sample://dr-raju-license.pdf",
        "Dr_Raju_Medical_License.pdf"
      );

      console.log("Database initialized with verified starter doctors and credentials.");
    }
  } catch (err) {
    console.error("Error seeding initial data:", err.message);
  }
}

seedInitialDataIfEmpty();

// ========================================
// EXPORT DATABASE
// ========================================

module.exports = db;
