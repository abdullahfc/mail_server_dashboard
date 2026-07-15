const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// Ensure db directory exists
const dbDir = path.join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

const dbPath = path.join(dbDir, 'mail_dashboard.db');
const db = new sqlite3.Database(dbPath);

// Initialize Schema
db.serialize(() => {
  // Deliveries Table - Each row represents a single recipient delivery attempt
  db.run(`
    CREATE TABLE IF NOT EXISTS deliveries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME NOT NULL,
      queue_id VARCHAR(50),
      sender VARCHAR(255),
      recipient VARCHAR(255) NOT NULL,
      domain VARCHAR(255) NOT NULL,
      status VARCHAR(50) NOT NULL,
      reason TEXT,
      is_spam BOOLEAN DEFAULT 0,
      is_invalid BOOLEAN DEFAULT 0
    )
  `);

  // Create indexes for blazing fast query performance
  db.run(`CREATE INDEX IF NOT EXISTS idx_date ON deliveries(date)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_status ON deliveries(status)`);
  db.run(`CREATE INDEX IF NOT EXISTS idx_domain ON deliveries(domain)`);

  // Cleanup task: Fix historical data where successful deliveries were incorrectly marked as deferred due to transaction ID matching 'csi'
  db.run(`
    UPDATE deliveries 
    SET status = 'sent' 
    WHERE (reason LIKE '%250 %' OR reason LIKE '%250 2.0.0 OK%' OR reason LIKE '%queued as%') AND status != 'sent'
  `, (err) => {
    if (err) console.error("Error running database cleanup:", err);
    else console.log("Database cleanup: Historical records verified and corrected.");
  });

  // Cleanup task: Fix historical data where deferred or sent emails were incorrectly marked as invalid
  db.run(`
    UPDATE deliveries 
    SET is_invalid = 0 
    WHERE status != 'bounced' AND is_invalid = 1
  `, (err) => {
    if (err) console.error("Error running database invalid status cleanup:", err);
    else console.log("Database cleanup: Historical invalid statuses verified and corrected.");
  });
});

// Helper functions for easy querying
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const runInsert = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this.lastID);
    });
  });
};

module.exports = {
  db,
  runQuery,
  runInsert
};
