// server/services/frameworkFinder.js
const sqlite3 = require("sqlite3").verbose();
const { open } = require("sqlite");
const ExcelJS = require("exceljs"); // Using the secure exceljs package
const Fuse = require("fuse.js");
const path = require("path");
const logger = require("../utils/logger");

class FrameworkFinderService {
  constructor() {
    this.db = null;
    this.fuse = null;
    this.frameworks = [];
    this.initPromise = this.initialize();
  }

  async initialize() {
    try {
      const dbPath =
        process.env.NODE_ENV === "production"
          ? "/data/frameworks.db"
          : path.join(__dirname, "../data/frameworks.db");

      this.db = await open({
        filename: dbPath,
        driver: sqlite3.Database,
      });

      await this.db.exec(`
        CREATE TABLE IF NOT EXISTS frameworks (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          category TEXT,
          description TEXT,
          base_prompt TEXT,
          tone_modifiers TEXT,
          role_variations TEXT,
          output_formats TEXT,
          token_estimate INTEGER,
          tags TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await this.refreshFrameworkCache();
      logger.info("FrameworkFinder service initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize FrameworkFinder service:", error);
      throw error;
    }
  }

  async refreshFrameworkCache() {
    try {
      this.frameworks = await this.db.all("SELECT * FROM frameworks");

      const fuseOptions = {
        keys: [
          { name: "name", weight: 0.4 },
          { name: "category", weight: 0.3 },
          { name: "description", weight: 0.2 },
        ],
        threshold: 0.6,
        includeScore: true,
        minMatchCharLength: 2,
      };

      this.fuse = new Fuse(this.frameworks, fuseOptions);
      logger.info(
        `Framework cache refreshed with ${this.frameworks.length} frameworks`
      );
    } catch (error) {
      logger.error("Failed to refresh framework cache:", error);
      throw error;
    }
  }

  // ### THIS FUNCTION HAS BEEN UPDATED ###
  async uploadExcelFrameworks(filePath) {
    try {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.getWorksheet(1); // Get the first worksheet
      const data = [];
      const headers = worksheet.getRow(1).values;

      // Convert rows to a JSON object array
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber > 1) {
          // Skip header row
          let rowData = {};
          row.values.forEach((value, index) => {
            if (headers[index]) {
              // Ensure header exists
              rowData[headers[index]] = value;
            }
          });
          data.push(rowData);
        }
      });

      let insertedCount = 0;

      for (const row of data) {
        try {
          const framework = {
            name: row.Name || row.name || "",
            category: row.Category || row.category || "General",
            description: row.Description || row.description || "",
            base_prompt:
              row["Base Prompt"] || row.base_prompt || row.prompt || "",
            tone_modifiers: JSON.stringify(
              this.parseArrayField(row["Tone Modifiers"] || row.tone_modifiers)
            ),
            role_variations: JSON.stringify(
              this.parseArrayField(
                row["Role Variations"] || row.role_variations
              )
            ),
            output_formats: JSON.stringify(
              this.parseArrayField(row["Output Formats"] || row.output_formats)
            ),
            token_estimate:
              parseInt(row["Token Estimate"] || row.token_estimate) || 100,
            tags: JSON.stringify(this.parseArrayField(row.Tags || row.tags)),
          };

          if (!framework.name || !framework.base_prompt) {
            logger.warn(
              "Skipping invalid framework row:",
              framework.name || "unnamed"
            );
            continue;
          }

          await this.db.run(
            `
            INSERT INTO frameworks (name, category, description, base_prompt, tone_modifiers, role_variations, output_formats, token_estimate, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
          `,
            [
              framework.name,
              framework.category,
              framework.description,
              framework.base_prompt,
              framework.tone_modifiers,
              framework.role_variations,
              framework.output_formats,
              framework.token_estimate,
              framework.tags,
            ]
          );
          insertedCount++;
        } catch (rowError) {
          logger.error(
            `Error inserting framework row ${row.Name || "unnamed"}:`,
            rowError
          );
        }
      }

      await this.refreshFrameworkCache();

      logger.info(
        `Successfully imported ${insertedCount} frameworks from Excel`
      );
      return { success: true, inserted: insertedCount, total: data.length };
    } catch (error) {
      logger.error("Failed to upload Excel frameworks:", error);
      throw error;
    }
  }

  parseArrayField(field) {
    if (!field) return [];
    if (Array.isArray(field)) return field;
    if (typeof field === "string") {
      try {
        return JSON.parse(field);
      } catch {
        return field
          .split(",")
          .map((item) => item.trim())
          .filter((item) => item.length > 0);
      }
    }
    return [];
  }

  async findFrameworks(query, options = {}) {
    await this.initPromise;
    const {
      category = null,
      maxResults = 10,
      threshold = 0.6,
      requireExactMatch = false,
    } = options;

    try {
      let results = [];
      if (requireExactMatch) {
        const sql = category
          ? "SELECT * FROM frameworks WHERE category = ? AND (name LIKE ? OR description LIKE ?)"
          : "SELECT * FROM frameworks WHERE name LIKE ? OR description LIKE ?";
        const params = category
          ? [category, `%${query}%`, `%${query}%`]
          : [`%${query}%`, `%${query}%`];
        results = await this.db.all(sql, params);
      } else {
        const searchResults = this.fuse.search(query);
        results = searchResults
          .filter((result) => result.score <= threshold)
          .map((result) => ({
            ...result.item,
            matchScore: result.score,
          }));
        if (category) {
          results = results.filter(
            (framework) => framework.category === category
          );
        }
      }

      results = results.slice(0, maxResults);
      results = results.map((framework) => ({
        ...framework,
        tone_modifiers: this.safeJsonParse(framework.tone_modifiers),
        role_variations: this.safeJsonParse(framework.role_variations),
        output_formats: this.safeJsonParse(framework.output_formats),
        tags: this.safeJsonParse(framework.tags),
      }));

      logger.info(`Found ${results.length} frameworks for query: "${query}"`);
      return results;
    } catch (error) {
      logger.error("Failed to find frameworks:", error);
      throw error;
    }
  }

  safeJsonParse(jsonString) {
    try {
      return JSON.parse(jsonString || "[]");
    } catch {
      return [];
    }
  }

  async getFrameworkById(id) {
    await this.initPromise;
    try {
      const framework = await this.db.get(
        "SELECT * FROM frameworks WHERE id = ?",
        [id]
      );
      if (!framework) return null;
      return {
        ...framework,
        tone_modifiers: this.safeJsonParse(framework.tone_modifiers),
        role_variations: this.safeJsonParse(framework.role_variations),
        output_formats: this.safeJsonParse(framework.output_formats),
        tags: this.safeJsonParse(framework.tags),
      };
    } catch (error) {
      logger.error("Failed to get framework by ID:", error);
      throw error;
    }
  }

  async getAllCategories() {
    await this.initPromise;
    try {
      const rows = await this.db.all(
        "SELECT DISTINCT category FROM frameworks ORDER BY category"
      );
      return rows.map((row) => row.category);
    } catch (error) {
      logger.error("Failed to get categories:", error);
      throw error;
    }
  }

  async getFrameworkStats() {
    await this.initPromise;
    try {
      const totalCount = await this.db.get(
        "SELECT COUNT(*) as count FROM frameworks"
      );
      const categoryStats = await this.db.all(`
        SELECT category, COUNT(*) as count 
        FROM frameworks 
        GROUP BY category 
        ORDER BY count DESC
      `);
      return {
        total: totalCount.count,
        categories: categoryStats,
      };
    } catch (error) {
      logger.error("Failed to get framework stats:", error);
      throw error;
    }
  }

  async getAllFrameworks() {
    await this.initPromise;
    return this.frameworks;
  }

  async addDynamicFramework(framework) {
    await this.initPromise;
    try {
      await this.db.run(
        `
        INSERT INTO frameworks 
        (name, category, description, base_prompt, tone_modifiers, role_variations,
         output_formats, token_estimate, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
        [
          framework.name,
          framework.category,
          framework.description,
          framework.base_prompt,
          JSON.stringify([]),
          JSON.stringify([]),
          JSON.stringify(framework.output_formats || []),
          framework.token_estimate || 200,
          JSON.stringify(framework.domain_tags || []),
        ]
      );
      await this.refreshFrameworkCache();
      logger.info("Dynamic framework added successfully");
    } catch (error) {
      logger.error("Failed to add dynamic framework:", error);
      throw error;
    }
  }

  async recordFeedback(
    requestHash,
    userRequest,
    frameworkId,
    intent,
    rating,
    feedback,
    recommendations
  ) {
    await this.initPromise;
    try {
      await this.db.run(
        `
        INSERT INTO user_feedback 
        (request_hash, user_request, framework_id, intent, rating, feedback_text, recommendations)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `,
        [
          requestHash,
          userRequest,
          frameworkId,
          intent,
          rating,
          feedback,
          JSON.stringify(recommendations),
        ]
      );
      logger.info("Feedback recorded successfully");
    } catch (error) {
      logger.error("Failed to record feedback:", error);
    }
  }
}

module.exports = FrameworkFinderService;
