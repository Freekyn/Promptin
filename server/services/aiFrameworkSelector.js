// services/aiFrameworkSelector.js
const OpenAI = require("openai");
const logger = require("../utils/logger");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

class AIFrameworkSelector {
  async selectBestFramework(userRequest, analysis, availableFrameworks) {
    try {
      logger.info(
        `AI selecting from ${availableFrameworks.length} frameworks for: "${userRequest}"`
      );

      // Limit to top 50 frameworks to avoid token limits
      const frameworkSummaries = availableFrameworks.slice(0, 50).map((f) => ({
        id: f.id,
        name: f.name,
        category: f.category,
        description: f.description?.substring(0, 100) || "",
      }));

      const selectionPrompt = `You are an expert at matching user requests to the best frameworks.

User Request: "${userRequest}"
Intent: ${analysis.intent || "general"}
Domain: ${analysis.domain || "general"}
Complexity: ${analysis.complexity || "medium"}

Available Frameworks:
${frameworkSummaries
  .map((f) => `${f.id}: ${f.name} (${f.category}) - ${f.description}`)
  .join("\n")}

Select the 3 most relevant frameworks and rank them by relevance score (0-100). Consider:
- Domain alignment with the request
- Methodology appropriateness  
- Complexity level match
- Output type compatibility

Return ONLY valid JSON in this exact format:
[
  {"id": 123, "relevance": 85, "reason": "Perfect match for domain and complexity"},
  {"id": 456, "relevance": 72, "reason": "Good methodology fit"},
  {"id": 789, "relevance": 68, "reason": "Relevant category match"}
]`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: selectionPrompt }],
        temperature: 0.3,
        max_tokens: 800,
      });

      const content = response.choices[0].message.content.trim();
      logger.info(`AI framework selection response: ${content}`);

      // Parse JSON response
      const selections = JSON.parse(content);

      if (Array.isArray(selections) && selections.length > 0) {
        return selections;
      }

      throw new Error("Invalid response format from AI selector");
    } catch (error) {
      logger.error("AI Framework Selector error:", error);
      return null;
    }
  }

  async createDynamicFramework(userRequest, analysis) {
    try {
      logger.info(`Creating dynamic framework for: "${userRequest}"`);

      const creationPrompt = `Create a custom framework for this specific request.

User Request: "${userRequest}"
Intent: ${analysis.intent || "general"}
Domain: ${analysis.domain || "general"}
Complexity: ${analysis.complexity || "medium"}

Create a framework with:
- A descriptive name
- A brief description
- A structured methodology with 4-6 steps

Return ONLY valid JSON:
{
  "name": "Framework Name",
  "category": "AI-Generated",
  "description": "Brief description of what this framework does",
  "methodology": [
    "Step 1: Clear action",
    "Step 2: Specific process",
    "Step 3: Implementation",
    "Step 4: Validation"
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: creationPrompt }],
        temperature: 0.7,
        max_tokens: 600,
      });

      const content = response.choices[0].message.content.trim();
      const framework = JSON.parse(content);

      // Add required properties
      framework.id = "dynamic_" + Date.now();
      framework.relevanceScore = 95;
      framework.base_prompt = this.buildBasePrompt(framework, userRequest);

      return framework;
    } catch (error) {
      logger.error("Dynamic framework creation error:", error);
      return this.getDefaultFramework(userRequest);
    }
  }

  buildBasePrompt(framework, userRequest) {
    return `You are an expert professional specializing in ${framework.category
      .toLowerCase()
      .replace("-", " ")}.

User Request: "${userRequest}"

Follow this ${framework.name} methodology:
${framework.methodology
  .map((step, index) => `${index + 1}. ${step}`)
  .join("\n")}

${framework.description}

Provide detailed, actionable guidance that addresses the user's specific needs.`;
  }

  getDefaultFramework(userRequest) {
    return {
      id: "default_" + Date.now(),
      name: "Universal Problem-Solving Framework",
      category: "General",
      description: "A flexible approach for addressing diverse challenges",
      relevanceScore: 75,
      base_prompt: `You are an expert consultant with broad experience.

User Request: "${userRequest}"

Follow this systematic approach:
1. Analyze the situation and requirements
2. Identify key challenges and opportunities  
3. Develop a structured solution approach
4. Provide specific implementation steps
5. Include success metrics and validation

Deliver comprehensive, actionable guidance.`,
    };
  }
}

module.exports = new AIFrameworkSelector();
