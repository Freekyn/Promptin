const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./data/frameworks.db');

db.all("SELECT name, category, description FROM frameworks WHERE category LIKE '%marketing%' OR category LIKE '%advertising%' OR category LIKE '%copy%' LIMIT 20", (err, rows) => {
  if (err) {
    console.error(err);
  } else {
    console.log('Marketing-related frameworks:');
    console.log(JSON.stringify(rows, null, 2));
  }
  db.close();
});