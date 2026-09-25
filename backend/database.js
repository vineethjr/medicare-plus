const Database = require("better-sqlite3");

const db = new Database("database.sqlite");

db.pragma("journal_mode = WAL");

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

    FOREIGN KEY (appointment_id)
      REFERENCES appointments(id),

    FOREIGN KEY (patient_id)
      REFERENCES users(id),

    FOREIGN KEY (doctor_id)
      REFERENCES users(id)
  )
`);

// ========================================
// DATABASE MIGRATION HELPER
// ========================================

function addColumnIfMissing(tableName, columnName, columnDefinition) {
  try {
    db.exec(
      `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${columnDefinition}`
    );
  } catch (error) {
    if (!error.message.includes("duplicate column name")) {
      throw error;
    }
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

console.log("SQLite database connected successfully");

module.exports = db;