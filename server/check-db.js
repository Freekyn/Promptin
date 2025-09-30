const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

console.log('🔍 Comprehensive System Check\n');

// Check 1: Database Structure
const db = new sqlite3.Database(path.join(__dirname, 'data', 'frameworks.db'));

console.log('1️⃣ Checking Database Schema...');

db.serialize(() => {
  // Check frameworks table structure
  db.all("PRAGMA table_info(frameworks)", (err, columns) => {
    if (err) {
      console.error('❌ Error checking frameworks table:', err);
      return;
    }
    
    console.log('\nFrameworks table columns:');
    const columnNames = columns.map(col => col.name);
    columns.forEach(col => {
      console.log(`  - ${col.name} (${col.type})`);
    });
    
    // Check for required columns
    const requiredColumns = ['id', 'name', 'category', 'description', 'base_prompt', 'output_formats'];
    const missingColumns = requiredColumns.filter(col => !columnNames.includes(col));
    
    if (missingColumns.length > 0) {
      console.log('\n⚠️  Missing columns:', missingColumns.join(', '));
    } else {
      console.log('\n✅ All required columns present');
    }
    
    // Check 2: Framework Count
    db.get("SELECT COUNT(*) as count FROM frameworks", (err, result) => {
      if (err) {
        console.error('❌ Error counting frameworks:', err);
      } else {
        console.log(`\n2️⃣ Total frameworks in database: ${result.count}`);
      }
      
      // Check 3: Sample Framework
      db.get("SELECT * FROM frameworks LIMIT 1", (err, framework) => {
        if (err) {
          console.error('❌ Error fetching sample framework:', err);
        } else if (framework) {
          console.log('\n3️⃣ Sample framework:');
          console.log(`  - Name: ${framework.name}`);
          console.log(`  - Category: ${framework.category}`);
          console.log(`  - Has base_prompt: ${framework.base_prompt ? 'Yes' : 'No'}`);
          console.log(`  - Output formats: ${framework.output_formats}`);
        }
        
        // Check 4: Check for new tables
        db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
          if (err) {
            console.error('❌ Error checking tables:', err);
          } else {
            console.log('\n4️⃣ Database tables:');
            tables.forEach(table => {
              console.log(`  - ${table.name}`);
            });
            
            const hasUserFeedback = tables.some(t => t.name === 'user_feedback');
            const hasDynamicFrameworks = tables.some(t => t.name === 'dynamic_frameworks');
            
            console.log(`\n  User feedback table: ${hasUserFeedback ? '✅ Exists' : '❌ Missing'}`);
            console.log(`  Dynamic frameworks table: ${hasDynamicFrameworks ? '✅ Exists' : '❌ Missing'}`);
          }
          
          // Check 5: Environment
          console.log('\n5️⃣ Environment Check:');
          console.log(`  - Node version: ${process.version}`);
          console.log(`  - OpenAI API Key: ${process.env.OPENAI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
          console.log(`  - Working directory: ${process.cwd()}`);
          
          // Check 6: Required files
          console.log('\n6️⃣ Required Files:');
          const requiredFiles = [
            'services/intentAnalyzer.js',
            'services/frameworkFinder.js',
            'services/promptBuilder.js',
            'routes/api.js',
            '.env'
          ];
          
          requiredFiles.forEach(file => {
            const exists = fs.existsSync(file);
            console.log(`  - ${file}: ${exists ? '✅ Exists' : '❌ Missing'}`);
          });
          
          console.log('\n✅ System check complete!');
          
          db.close();
        });
      });
    });
  });
});