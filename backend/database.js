
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
// EXPORT DATABASE
// ========================================

module.exports = db;
