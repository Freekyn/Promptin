// update_schema.js - Database Schema Updater
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function updateSchema() {
  console.log('🔄 Updating database schema...');
  
  try {
    const db = await open({
      filename: path.join(__dirname, 'data/frameworks.db'),
      driver: sqlite3.Database
    });

    // Add new columns one by one with error handling
    const newColumns = [
      'platforms TEXT DEFAULT \'[]\'',
      'models TEXT DEFAULT \'[]\'', 
      'complexity_level TEXT DEFAULT \'medium\'',
      'domain_tags TEXT DEFAULT \'[]\'',
      'use_cases TEXT DEFAULT \'[]\'',
      'optimal_role TEXT DEFAULT \'\'',
      'primary_tone TEXT DEFAULT \'professional\''
    ];

    for (const column of newColumns) {
      try {
        const columnName = column.split(' ')[0];
        await db.exec(`ALTER TABLE frameworks ADD COLUMN ${column}`);
        console.log(`✅ Added column: ${columnName}`);
      } catch (e) {
        if (e.message.includes('duplicate column name')) {
          console.log(`ℹ️ Column already exists: ${column.split(' ')[0]}`);
        } else {
          console.log(`⚠️ Error adding column ${column.split(' ')[0]}: ${e.message}`);
        }
      }
    }

    // Show current schema
    const schema = await db.all("PRAGMA table_info(frameworks)");
    console.log('\n📋 Current schema:');
    schema.forEach(col => {
      console.log(`  ${col.name}: ${col.type}`);
    });

    await db.close();
    console.log('\n✅ Schema update complete!');
    
  } catch (error) {
    console.error('❌ Schema update failed:', error);
  }
}

if (require.main === module) {
  updateSchema();
}

module.exports = { updateSchema };