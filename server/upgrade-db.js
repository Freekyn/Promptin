const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

console.log('Starting database upgrade...');

const db = new sqlite3.Database(path.join(__dirname, 'data', 'frameworks.db'));

const sql = fs.readFileSync(path.join(__dirname, 'data', 'upgrade_database.sql'), 'utf8');

db.exec(sql, (err) => {
  if (err) {
    console.error('Error upgrading database:', err);
  } else {
    console.log('Database upgraded successfully!');
  }
  db.close();
});