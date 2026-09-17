const Database = require("better-sqlite3");

const db = new Database("database.sqlite");

db.pragma("journal_mode = WAL");

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

function addColumnIfMissing(columnName, columnDefinition) {
  try {
    db.exec(
      `ALTER TABLE users ADD COLUMN ${columnName} ${columnDefinition}`
    );
  } catch (error) {
    if (!error.message.includes("duplicate column name")) {
      throw error;
    }
  }
}

/*
  These migrations make sure existing users
  also receive the new profile fields.
*/

addColumnIfMissing("specialization", "TEXT");
addColumnIfMissing("qualification", "TEXT");
addColumnIfMissing("experience", "INTEGER DEFAULT 0");
addColumnIfMissing("consultation_fee", "INTEGER DEFAULT 0");
addColumnIfMissing("hospital", "TEXT");
addColumnIfMissing("bio", "TEXT");
addColumnIfMissing("availability", "TEXT");

console.log("SQLite database connected successfully");

module.exports = db;