const sqlite3 = require('sqlite3').verbose();
const path = require('path');

console.log('Starting database upgrade...');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'frameworks.db'));

// Run each command separately and handle errors gracefully
const commands = [
  // Try to add columns (will fail if they already exist, which is OK)
  `ALTER TABLE frameworks ADD COLUMN domain_tags TEXT`,
  `ALTER TABLE frameworks ADD COLUMN complexity_level TEXT DEFAULT 'medium'`,
  `ALTER TABLE frameworks ADD COLUMN platforms TEXT`,
  `ALTER TABLE frameworks ADD COLUMN models TEXT`,
  `ALTER TABLE frameworks ADD COLUMN relevance_score INTEGER DEFAULT 0`,
  `ALTER TABLE frameworks ADD COLUMN confidence_score INTEGER DEFAULT 0`,
  `ALTER TABLE frameworks ADD COLUMN source TEXT DEFAULT 'manual'`,
  
  // Create new tables
  `CREATE TABLE IF NOT EXISTS user_feedback (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_hash TEXT NOT NULL,
    user_request TEXT NOT NULL,
    framework_id INTEGER,
    intent TEXT,
    rating INTEGER,
    feedback_text TEXT,
    recommendations TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (framework_id) REFERENCES frameworks (id)
  )`,
  
  `CREATE TABLE IF NOT EXISTS dynamic_frameworks (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT,
    description TEXT,
    base_prompt TEXT,
    methodology TEXT,
    key_principles TEXT,
    success_metrics TEXT,
    domain_tags TEXT,
    complexity_level TEXT,
    output_formats TEXT,
    platforms TEXT,
    models TEXT,
    confidence_score INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    usage_count INTEGER DEFAULT 0
  )`,
  
  // Create indexes
  `CREATE INDEX IF NOT EXISTS idx_feedback_request ON user_feedback(request_hash)`,
  `CREATE INDEX IF NOT EXISTS idx_frameworks_domain ON frameworks(domain_tags)`,
  `CREATE INDEX IF NOT EXISTS idx_frameworks_complexity ON frameworks(complexity_level)`
];

let completed = 0;
let errors = 0;

commands.forEach((cmd, index) => {
  db.run(cmd, (err) => {
    if (err && !err.message.includes('duplicate column name')) {
      console.error(`Error on command ${index + 1}:`, err.message);
      errors++;
    } else {
      completed++;
    }
    
    if (completed + errors === commands.length) {
      console.log(`\nUpgrade completed: ${completed} successful, ${errors} errors`);
      console.log('Note: "duplicate column name" errors are expected and OK!');
      db.close();
    }
  });
});