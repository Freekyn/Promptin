// server/scripts/migrate.js - Database migration and initialization
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs');

async function migrate() {
  console.log('🔄 Starting database migration...');
  
  try {
    // Ensure data directory exists
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('📁 Created data directory');
    }

    // Open database connection
    const db = await open({
      filename: path.join(dataDir, 'frameworks.db'),
      driver: sqlite3.Database
    });

    console.log('✅ Connected to SQLite database');

    // Create frameworks table
    await db.exec(`
      CREATE TABLE IF NOT EXISTS frameworks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        category TEXT DEFAULT 'General',
        description TEXT,
        base_prompt TEXT NOT NULL,
        tone_modifiers TEXT DEFAULT '[]', -- JSON string
        role_variations TEXT DEFAULT '[]', -- JSON string
        output_formats TEXT DEFAULT '[]', -- JSON string
        token_estimate INTEGER DEFAULT 100,
        tags TEXT DEFAULT '[]', -- JSON string for searchability
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ Created frameworks table');

    // Create indexes for better performance
    await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_frameworks_name ON frameworks(name);
      CREATE INDEX IF NOT EXISTS idx_frameworks_category ON frameworks(category);
      CREATE INDEX IF NOT EXISTS idx_frameworks_created_at ON frameworks(created_at);
    `);

    console.log('✅ Created database indexes');

    // Insert sample frameworks if table is empty
    const count = await db.get('SELECT COUNT(*) as count FROM frameworks');
    
    if (count.count === 0) {
      console.log('📝 Inserting sample frameworks...');
      
      const sampleFrameworks = [
        {
          name: "Content Creation",
          category: "Marketing",
          description: "Generate engaging content for various marketing channels",
          base_prompt: "Create compelling content that engages the target audience and drives action. Focus on clear value proposition and call-to-action.",
          tone_modifiers: JSON.stringify(["persuasive", "engaging", "professional"]),
          role_variations: JSON.stringify(["CMO", "Content Creator", "Marketing Manager"]),
          output_formats: JSON.stringify(["markdown", "html", "plain"]),
          token_estimate: 200,
          tags: JSON.stringify(["marketing", "content", "engagement", "copywriting"])
        },
        {
          name: "Data Analysis",
          category: "Analytics",
          description: "Analyze data patterns and generate insights",
          base_prompt: "Analyze the provided data systematically. Identify key patterns, trends, and actionable insights. Present findings with supporting evidence.",
          tone_modifiers: JSON.stringify(["analytical", "technical", "objective"]),
          role_variations: JSON.stringify(["Data Scientist", "Analyst", "Researcher"]),
          output_formats: JSON.stringify(["markdown", "json", "plain"]),
          token_estimate: 300,
          tags: JSON.stringify(["data", "analysis", "insights", "statistics"])
        },
        {
          name: "Code Review",
          category: "Development",
          description: "Review code quality, security, and best practices",
          base_prompt: "Review the provided code for quality, security vulnerabilities, performance issues, and adherence to best practices. Provide specific recommendations for improvement.",
          tone_modifiers: JSON.stringify(["technical", "constructive", "detailed"]),
          role_variations: JSON.stringify(["Developer", "CTO", "Tech Lead"]),
          output_formats: JSON.stringify(["markdown", "code", "plain"]),
          token_estimate: 250,
          tags: JSON.stringify(["code", "review", "quality", "security", "development"])
        },
        {
          name: "Creative Writing",
          category: "Creative",
          description: "Generate creative and imaginative written content",
          base_prompt: "Create original, engaging content that captures the reader's imagination. Use vivid descriptions, compelling characters, and engaging narrative structure.",
          tone_modifiers: JSON.stringify(["creative", "imaginative", "engaging"]),
          role_variations: JSON.stringify(["Writer", "Creative Director", "Storyteller"]),
          output_formats: JSON.stringify(["markdown", "plain", "html"]),
          token_estimate: 400,
          tags: JSON.stringify(["creative", "writing", "storytelling", "narrative"])
        },
        {
          name: "Technical Documentation",
          category: "Documentation",
          description: "Create clear, comprehensive technical documentation",
          base_prompt: "Write clear, comprehensive technical documentation that helps users understand and implement the described processes or systems. Include examples and troubleshooting guidance.",
          tone_modifiers: JSON.stringify(["technical", "clear", "instructional"]),
          role_variations: JSON.stringify(["Technical Writer", "Developer", "Product Manager"]),
          output_formats: JSON.stringify(["markdown", "html", "plain"]),
          token_estimate: 350,
          tags: JSON.stringify(["documentation", "technical", "instructions", "guide"])
        },
        {
          name: "Image Generation Prompt",
          category: "AI Art",
          description: "Create detailed prompts for AI image generation",
          base_prompt: "Create a detailed, vivid prompt for AI image generation. Include specific details about subject, style, composition, lighting, colors, and artistic techniques.",
          tone_modifiers: JSON.stringify(["descriptive", "detailed", "artistic"]),
          role_variations: JSON.stringify(["Designer", "Artist", "Creative Director"]),
          output_formats: JSON.stringify(["image_prompt", "plain", "markdown"]),
          token_estimate: 150,
          tags: JSON.stringify(["image", "prompt", "ai-art", "visual", "creative"])
        }
      ];

      for (const framework of sampleFrameworks) {
        await db.run(`
          INSERT INTO frameworks (name, category, description, base_prompt, tone_modifiers, role_variations, output_formats, token_estimate, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          framework.name,
          framework.category,
          framework.description,
          framework.base_prompt,
          framework.tone_modifiers,
          framework.role_variations,
          framework.output_formats,
          framework.token_estimate,
          framework.tags
        ]);
      }

      console.log(`✅ Inserted ${sampleFrameworks.length} sample frameworks`);
    } else {
      console.log(`ℹ️  Database already contains ${count.count} frameworks`);
    }

    // Create additional tables for future features
    await db.exec(`
      CREATE TABLE IF NOT EXISTS usage_analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        framework_id INTEGER,
        user_id TEXT,
        session_id TEXT,
        prompt_tokens INTEGER,
        completion_tokens INTEGER,
        total_tokens INTEGER,
        model_used TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (framework_id) REFERENCES frameworks (id)
      )
    `);

    console.log('✅ Created analytics table');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS api_keys (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key_hash TEXT UNIQUE NOT NULL,
        name TEXT,
        usage_limit INTEGER DEFAULT 1000,
        usage_count INTEGER DEFAULT 0,
        active BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME
      )
    `);

    console.log('✅ Created API keys table');

    // Close database connection
    await db.close();
    
    console.log('🎉 Database migration completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  migrate().then(() => {
    console.log('✨ Migration script finished');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { migrate };