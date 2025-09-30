// bulk_import.js - Intelligent Bulk Framework Importer
const XLSX = require('xlsx');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

class IntelligentFrameworkParser {
  constructor() {
    this.db = null;
  }

  async initialize() {
    this.db = await open({
      filename: path.join(__dirname, 'data/frameworks.db'),
      driver: sqlite3.Database
    });

    // Add new columns for intelligent features
    try {
      await this.db.exec(`
        ALTER TABLE frameworks ADD COLUMN platforms TEXT DEFAULT '[]';
        ALTER TABLE frameworks ADD COLUMN models TEXT DEFAULT '[]';
        ALTER TABLE frameworks ADD COLUMN complexity_level TEXT DEFAULT 'medium';
        ALTER TABLE frameworks ADD COLUMN domain_tags TEXT DEFAULT '[]';
        ALTER TABLE frameworks ADD COLUMN use_cases TEXT DEFAULT '[]';
      `);
    } catch (e) {
      // Columns might exist
      console.log('Database schema ready');
    }
  }

  parseMultiValue(value, separator = ';') {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    
    return value.toString()
      .split(separator)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  intelligentRoleSelection(roles) {
    // Extract the most specific/optimal role from multiple options
    const rolePriority = {
      'CEO': 10, 'CTO': 9, 'CMO': 8, 'Product Manager': 7,
      'Data Scientist': 6, 'AI Engineer': 5, 'Researcher': 4,
      'Content Creator': 3, 'Marketing Manager': 2, 'Analyst': 1
    };

    const parsedRoles = this.parseMultiValue(roles);
    
    // Return the highest priority role, or first if none match
    const bestRole = parsedRoles.find(role => 
      Object.keys(rolePriority).some(key => role.includes(key))
    ) || parsedRoles[0];

    return parsedRoles; // Return all for now, we'll optimize later
  }

  intelligentToneSelection(tones) {
    const parsedTones = this.parseMultiValue(tones);
    
    // Smart tone mapping
    const toneMapping = {
      'Professional': 'professional',
      'Analytical': 'analytical', 
      'Creative': 'creative',
      'Casual': 'casual',
      'Technical': 'technical',
      'Persuasive': 'persuasive'
    };

    return parsedTones.map(tone => {
      const mapped = Object.keys(toneMapping).find(key => 
        tone.toLowerCase().includes(key.toLowerCase())
      );
      return mapped ? toneMapping[mapped] : tone.toLowerCase();
    });
  }

  extractDomainTags(framework, category, explanation) {
    // Intelligent domain extraction
    const domains = [];
    const text = `${framework} ${category} ${explanation}`.toLowerCase();

    const domainKeywords = {
      'data': ['data', 'analysis', 'analytics', 'statistics', 'insight'],
      'marketing': ['marketing', 'content', 'campaign', 'brand', 'audience'],
      'reasoning': ['reasoning', 'logic', 'think', 'problem', 'solution'],
      'creative': ['creative', 'design', 'artistic', 'innovation', 'imagination'],
      'technical': ['code', 'programming', 'development', 'technical', 'engineering'],
      'business': ['business', 'strategy', 'management', 'planning', 'execution']
    };

    Object.entries(domainKeywords).forEach(([domain, keywords]) => {
      if (keywords.some(keyword => text.includes(keyword))) {
        domains.push(domain);
      }
    });

    return domains.length > 0 ? domains : [category.toLowerCase()];
  }

  generateBasePrompt(framework, explanation) {
    // Create intelligent base prompt instead of templates
    const frameworkLower = framework.toLowerCase();
    
    if (frameworkLower.includes('chain') || frameworkLower.includes('step')) {
      return `Using the ${framework} approach: ${explanation} Think through this systematically, showing each step of your reasoning process.`;
    } else if (frameworkLower.includes('tree') || frameworkLower.includes('branch')) {
      return `Apply the ${framework} methodology: ${explanation} Explore multiple solution paths and evaluate each approach.`;
    } else if (frameworkLower.includes('react') || frameworkLower.includes('acting')) {
      return `Implement the ${framework} framework: ${explanation} Combine reasoning with action-taking in an iterative process.`;
    } else {
      return `Using the ${framework} framework: ${explanation} Apply this methodology to approach the problem systematically.`;
    }
  }

  async parseExcelFile(filePath) {
    console.log('📖 Reading Excel file...');
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);

    console.log(`📊 Found ${data.length} frameworks to process`);
    
    // Clear existing frameworks
    await this.db.run('DELETE FROM frameworks');
    console.log('🗑️ Cleared existing frameworks');

    let inserted = 0;
    let failed = 0;

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      
      try {
        // Map Excel columns (handle various naming)
        const framework = {
          name: row.Framework || row.framework || row.Name || '',
          category: row.Category || row.category || 'General',
          description: row.Explanation || row.explanation || row.Description || '',
          tone_modifiers: this.intelligentToneSelection(row['Tone Recommendations'] || row.tone_recommendations || ''),
          role_variations: this.intelligentRoleSelection(row['Recommended Roles'] || row.recommended_roles || ''),
          output_formats: this.parseMultiValue(row['Output Formats'] || row.output_formats || ''),
          platforms: this.parseMultiValue(row['Compatible Platforms / Tools'] || row.platforms || ''),
          models: this.parseMultiValue(row['Suggested Models'] || row.models || ''),
          domain_tags: this.extractDomainTags(row.Framework || '', row.Category || '', row.Explanation || ''),
          base_prompt: this.generateBasePrompt(row.Framework || '', row.Explanation || '')
        };

        // Skip invalid rows
        if (!framework.name || !framework.description) {
          console.log(`⚠️ Skipping invalid row ${i + 1}: ${framework.name || 'unnamed'}`);
          failed++;
          continue;
        }

        // Insert into database
        await this.db.run(`
          INSERT INTO frameworks (
            name, category, description, base_prompt, 
            tone_modifiers, role_variations, output_formats, 
            platforms, models, domain_tags, tags, token_estimate
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          framework.name,
          framework.category,
          framework.description,
          framework.base_prompt,
          JSON.stringify(framework.tone_modifiers),
          JSON.stringify(framework.role_variations),
          JSON.stringify(framework.output_formats),
          JSON.stringify(framework.platforms),
          JSON.stringify(framework.models),
          JSON.stringify(framework.domain_tags),
          JSON.stringify([framework.category.toLowerCase(), ...framework.domain_tags]),
          this.estimateTokens(framework.base_prompt)
        ]);

        inserted++;
        
        if (inserted % 100 === 0) {
          console.log(`✅ Processed ${inserted} frameworks...`);
        }
        
      } catch (error) {
        console.error(`❌ Failed to import row ${i + 1}:`, error.message);
        failed++;
      }
    }

    console.log(`🎉 Import complete! ✅ ${inserted} imported, ❌ ${failed} failed`);
    return { inserted, failed, total: data.length };
  }

  estimateTokens(text) {
    return Math.ceil((text || '').length / 4);
  }

  async close() {
    if (this.db) {
      await this.db.close();
    }
  }
}

async function main() {
  const parser = new IntelligentFrameworkParser();
  
  try {
    await parser.initialize();
    
    // Use your Excel file
    const excelPath = 'uploads/prompt_frameworks_master.xlsx';
    const result = await parser.parseExcelFile(excelPath);
    
    console.log('\n📈 Import Summary:');
    console.log(`Total rows: ${result.total}`);
    console.log(`Successfully imported: ${result.inserted}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Success rate: ${((result.inserted / result.total) * 100).toFixed(1)}%`);
    
  } catch (error) {
    console.error('💥 Import failed:', error);
  } finally {
    await parser.close();
  }
}

if (require.main === module) {
  main();
}

module.exports = { IntelligentFrameworkParser };