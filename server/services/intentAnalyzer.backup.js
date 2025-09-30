// services/intentAnalyzer.js - Complete Adaptive AI-Powered Intent Analysis System
const OpenAI = require("openai");
const frameworkFinder = require("./frameworkFinder");
const logger = require("../utils/logger");

class IntentAnalyzer {
  constructor() {
    // Lazy load OpenAI to avoid initialization errors
    this.openai = null;
  }

  getOpenAI() {
    if (!this.openai) {
      if (!process.env.OPENAI_API_KEY) {
        throw new Error("OpenAI API key not configured");
      }
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    return this.openai;
  }

  async analyzeUserIntent(userRequest) {
    try {
      logger.info("🧠 Analyzing user intent...");

      const analysisPrompt = `
Analyze this user request and extract key information for prompt engineering:

User Request: "${userRequest}"

Extract and return a JSON object with:
1. "intent" - main goal (e.g., "data_analysis", "content_creation", "problem_solving", "creative_writing", "technical", "research", "business_strategy", "marketing", "music", "entertainment")
2. "domain" - field/industry (e.g., "marketing", "data_science", "education", "business", "technology", "creative", "research", "entertainment", "music")
3. "complexity" - complexity level ("simple", "medium", "complex")
4. "output_type" - desired output ("analysis", "content", "strategy", "code", "report", "creative", "dashboard", "document", "recommendation", "selection")
5. "tone_preference" - suggested tone ("professional", "casual", "analytical", "creative", "persuasive", "technical", "friendly", "expert")
6. "suggested_role" - best role for this task ("Data Scientist", "CMO", "Researcher", "Developer", "Consultant", "CEO", "Product Manager", "Designer", "Artist", "Music Producer", "Expert")
7. "keywords" - key terms to match frameworks (array of 3-5 words)
8. "reasoning_type" - if applicable ("step_by_step", "chain_of_thought", "tree_of_thought", "creative", "analytical")

Return only valid JSON, no explanations.
`;

      const response = await this.getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const analysis = JSON.parse(response.choices[0].message.content);
      logger.info("✅ Intent analysis complete:", analysis);

      return analysis;
    } catch (error) {
      logger.error(
        "❌ Intent analysis failed, using enhanced fallback:",
        error
      );

      // Enhanced fallback analysis
      return this.fallbackAnalysis(userRequest);
    }
  }

  fallbackAnalysis(userRequest) {
    const request = userRequest.toLowerCase();

    // Enhanced keyword-based fallback with comprehensive patterns
    const analysis = {
      intent: "general",
      domain: "business",
      complexity: "medium",
      output_type: "analysis",
      tone_preference: "professional",
      suggested_role: "Consultant",
      keywords: ["analysis", "solution"],
      reasoning_type: "step_by_step",
    };

    // MUSIC & CREATIVE ENTERTAINMENT
    if (
      request.includes("song") ||
      request.includes("music") ||
      request.includes("singer") ||
      request.includes("performance") ||
      request.includes("competition") ||
      request.includes("tamil") ||
      request.includes("artist") ||
      request.includes("concert") ||
      request.includes("album")
    ) {
      analysis.intent = "creative_writing";
      analysis.domain = "entertainment";
      analysis.suggested_role = "Artist";
      analysis.tone_preference = "creative";
      analysis.output_type = "recommendation";
      analysis.keywords = [
        "creative",
        "music",
        "performance",
        "song",
        "entertainment",
      ];
    }
    // DATA & ANALYSIS
    else if (
      request.includes("data") ||
      request.includes("analysis") ||
      request.includes("dashboard") ||
      request.includes("trends") ||
      request.includes("metrics") ||
      request.includes("analytics")
    ) {
      analysis.intent = "data_analysis";
      analysis.domain = "data_science";
      analysis.suggested_role = "Data Scientist";
      analysis.tone_preference = "analytical";
      analysis.output_type = "dashboard";
      analysis.keywords = ["data", "analysis", "dashboard", "trends"];
    }
    // CONTENT & MARKETING
    else if (
      request.includes("content") ||
      request.includes("write") ||
      request.includes("blog") ||
      request.includes("marketing") ||
      request.includes("campaign") ||
      request.includes("copy")
    ) {
      analysis.intent = "content_creation";
      analysis.domain = "marketing";
      analysis.suggested_role = "CMO";
      analysis.tone_preference = "engaging";
      analysis.output_type = "content";
      analysis.keywords = ["content", "writing", "marketing"];
    }
    // TECHNICAL & CODE
    else if (
      request.includes("code") ||
      request.includes("program") ||
      request.includes("develop") ||
      request.includes("debug") ||
      request.includes("python") ||
      request.includes("javascript") ||
      request.includes("software") ||
      request.includes("app")
    ) {
      analysis.intent = "technical";
      analysis.domain = "technology";
      analysis.suggested_role = "Developer";
      analysis.tone_preference = "technical";
      analysis.output_type = "code";
      analysis.keywords = ["code", "programming", "development"];
    }
    // BUSINESS & STRATEGY
    else if (
      request.includes("strategy") ||
      request.includes("plan") ||
      request.includes("business") ||
      request.includes("growth") ||
      request.includes("market") ||
      request.includes("competitive")
    ) {
      analysis.intent = "business_strategy";
      analysis.domain = "business";
      analysis.suggested_role = "CEO";
      analysis.tone_preference = "professional";
      analysis.output_type = "strategy";
      analysis.keywords = ["strategy", "planning", "business"];
    }
    // DESIGN & VISUAL CREATIVE
    else if (
      request.includes("design") ||
      request.includes("creative") ||
      request.includes("video") ||
      request.includes("image") ||
      request.includes("art") ||
      request.includes("visual")
    ) {
      analysis.intent = "creative_writing";
      analysis.domain = "creative";
      analysis.suggested_role = "Designer";
      analysis.tone_preference = "creative";
      analysis.output_type = "creative";
      analysis.keywords = ["creative", "design", "artistic"];
    }
    // RESEARCH & ACADEMIC
    else if (
      request.includes("research") ||
      request.includes("study") ||
      request.includes("academic") ||
      request.includes("paper") ||
      request.includes("thesis") ||
      request.includes("analysis")
    ) {
      analysis.intent = "research";
      analysis.domain = "research";
      analysis.suggested_role = "Researcher";
      analysis.tone_preference = "analytical";
      analysis.output_type = "report";
      analysis.keywords = ["research", "study", "analysis"];
    }

    logger.info("Using enhanced fallback analysis:", analysis);
    return analysis;
  }

  async recommendFrameworks(analysis, limit = 5) {
    try {
      logger.info("🔍 Searching for relevant frameworks...");

      // Search frameworks based on extracted keywords
      let frameworks = [];

      for (const keyword of analysis.keywords) {
        const results = await frameworkFinder.findFrameworks(keyword, {
          maxResults: 15,
          threshold: 0.7,
        });
        frameworks.push(...results);
      }

      // Remove duplicates and score frameworks
      const uniqueFrameworks = frameworks.reduce((acc, framework) => {
        if (!acc.find((f) => f.id === framework.id)) {
          // Calculate relevance score
          framework.relevanceScore = this.calculateRelevanceScore(
            framework,
            analysis
          );
          acc.push(framework);
        }
        return acc;
      }, []);

      // Sort by relevance and return top results
      const sortedFrameworks = uniqueFrameworks
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, limit);

      logger.info(`✅ Found ${sortedFrameworks.length} relevant frameworks`);
      return sortedFrameworks;
    } catch (error) {
      logger.error("❌ Framework recommendation failed:", error);
      return [];
    }
  }

  calculateRelevanceScore(framework, analysis) {
    let score = 0;

    // Domain match (highest priority)
    if (
      framework.domain_tags &&
      framework.domain_tags.includes(analysis.domain)
    ) {
      score += 40;
    }

    // Category relevance
    const category = framework.category.toLowerCase();
    if (
      analysis.intent.includes(category) ||
      category.includes(analysis.intent)
    ) {
      score += 30;
    }

    // Name and description keyword matching
    const frameworkText =
      `${framework.name} ${framework.description}`.toLowerCase();
    analysis.keywords.forEach((keyword) => {
      if (frameworkText.includes(keyword.toLowerCase())) {
        score += 15;
      }
    });

    // Reasoning type match
    const name = framework.name.toLowerCase();
    if (
      analysis.reasoning_type &&
      name.includes(analysis.reasoning_type.replace("_", "-"))
    ) {
      score += 25;
    }

    // Complexity alignment
    if (framework.complexity_level === analysis.complexity) {
      score += 10;
    }

    // Output type compatibility
    if (framework.output_formats) {
      const formats = this.parseOutputFormats(framework.output_formats);
      if (
        formats.some((format) =>
          format.toLowerCase().includes(analysis.output_type)
        )
      ) {
        score += 20;
      }
    }

    return score;
  }

  parseOutputFormats(outputFormats) {
    if (!outputFormats) return ["Txt"];

    if (typeof outputFormats === "string") {
      try {
        // Try JSON parse first
        return JSON.parse(outputFormats);
      } catch {
        // Fallback to space or comma separation
        return outputFormats.split(/[\s,;]+/).filter((f) => f.length > 0);
      }
    }

    if (Array.isArray(outputFormats)) {
      return outputFormats;
    }

    return ["Txt"];
  }

  getIntelligentOutputFormats(analysis, selectedFramework) {
    try {
      // Parse framework formats safely
      const frameworkFormats = this.parseOutputFormats(
        selectedFramework.output_formats
      );

      // Intelligent format mapping based on intent and domain
      const intentFormatMapping = {
        data_analysis: [
          "Dashboard",
          "Excel",
          "Report",
          "Research Paper",
          "Notebook",
        ],
        content_creation: ["Website", "Pdf", "Powerpoint", "Script", "Video"],
        technical: ["Pipeline Script", "Runbook", "Protocol", "Model Chart"],
        creative_writing: ["Script", "Video", "Podcast", "Website", "Image"],
        business_strategy: [
          "Powerpoint",
          "Dashboard",
          "Logic Model",
          "Timeline",
        ],
        research: ["Research Paper", "Protocol", "Observation Plan", "Paper"],
        marketing: ["Website", "Video", "Image", "Powerpoint", "Script"],
        planning: ["Timeline", "Run of Show", "Checklist", "Logic Model"],
        entertainment: ["Script", "Plan", "List", "Recommendation", "Guide"],
      };

      // Get suggested formats for this intent
      const suggestedFormats = intentFormatMapping[analysis.intent] || [
        "Txt",
        "Pdf",
      ];

      // Find optimal formats (intersection of framework and suggested)
      const optimalFormats = frameworkFormats.filter((format) =>
        suggestedFormats.some(
          (suggested) =>
            format.toLowerCase().includes(suggested.toLowerCase()) ||
            suggested.toLowerCase().includes(format.toLowerCase())
        )
      );

      // Use optimal formats if found, otherwise use framework formats
      const finalFormats =
        optimalFormats.length > 0 ? optimalFormats : frameworkFormats;

      return {
        recommended: finalFormats[0] || "Txt",
        available: finalFormats,
        all: frameworkFormats,
        suggested: suggestedFormats,
      };
    } catch (error) {
      logger.error("❌ Format analysis failed:", error);
      return {
        recommended: "Txt",
        available: ["Txt"],
        all: ["Txt"],
        suggested: ["Txt"],
      };
    }
  }

  async getOptimalPlatformAndModel(analysis, selectedFramework) {
    try {
      // Parse platform and model data safely
      const platforms = this.parseOutputFormats(selectedFramework.platforms);
      const models = this.parseOutputFormats(selectedFramework.models);

      let recommendedPlatform = "ChatGPT";
      let recommendedModel = "GPT-4o";

      // Intelligent platform selection based on intent
      if (
        analysis.intent === "data_analysis" ||
        analysis.reasoning_type === "chain_of_thought"
      ) {
        recommendedPlatform = platforms.includes("Claude")
          ? "Claude"
          : "ChatGPT";
        recommendedModel =
          models.find((m) => m.includes("Claude-3 Opus")) ||
          models.find((m) => m.includes("GPT-4o")) ||
          "GPT-4o";
      } else if (
        analysis.intent === "creative_writing" ||
        analysis.domain === "entertainment"
      ) {
        recommendedPlatform = platforms.includes("ChatGPT")
          ? "ChatGPT"
          : "Claude";
        recommendedModel =
          models.find((m) => m.includes("GPT-4o")) ||
          models.find((m) => m.includes("Claude-3 Sonnet")) ||
          "GPT-4o";
      } else if (
        analysis.intent === "technical" ||
        analysis.output_type === "code"
      ) {
        recommendedPlatform = platforms.includes("ChatGPT")
          ? "ChatGPT"
          : "Claude";
        recommendedModel =
          models.find((m) => m.includes("o3")) ||
          models.find((m) => m.includes("GPT-4o")) ||
          "GPT-4o";
      } else if (analysis.intent === "business_strategy") {
        recommendedPlatform = platforms.includes("Claude")
          ? "Claude"
          : "ChatGPT";
        recommendedModel =
          models.find((m) => m.includes("Claude-3 Opus")) ||
          models.find((m) => m.includes("GPT-4o")) ||
          "GPT-4o";
      }

      // Special cases for image/video generation
      if (
        analysis.output_type.includes("image") ||
        analysis.intent.includes("image")
      ) {
        recommendedPlatform = "Midjourney";
        recommendedModel = "Midjourney v6";
      } else if (
        analysis.output_type.includes("video") ||
        analysis.intent.includes("video")
      ) {
        recommendedPlatform = "Sora";
        recommendedModel = "Sora v1";
      }

      return {
        platform: recommendedPlatform,
        model: recommendedModel,
        alternatives: {
          platforms: platforms.slice(0, 3),
          models: models.slice(0, 3),
        },
        reasoning: `Selected ${recommendedPlatform} for ${analysis.intent} tasks`,
      };
    } catch (error) {
      logger.error("❌ Platform recommendation failed:", error);
      return {
        platform: "ChatGPT",
        model: "GPT-4o",
        alternatives: { platforms: [], models: [] },
        reasoning: "Default selection due to error",
      };
    }
  }

  async createDynamicFramework(analysis, userRequest) {
    try {
      logger.info("🔧 Creating dynamic framework for request:", userRequest);

      const dynamicFrameworkPrompt = `
Create a structured approach framework for this request:
"${userRequest}"

Based on:
- Intent: ${analysis.intent}
- Domain: ${analysis.domain}  
- Complexity: ${analysis.complexity}
- Output needed: ${analysis.output_type}

Return ONLY valid JSON with this exact structure:
{
  "name": "Custom Framework Name",
  "description": "Brief description of what this framework does",
  "base_prompt": "Detailed step-by-step approach prompt for this specific request",
  "methodology": ["step1", "step2", "step3", "step4"]
}
`;

      const response = await this.getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: dynamicFrameworkPrompt }],
        temperature: 0.3,
        max_tokens: 600,
      });

      const dynamicFramework = JSON.parse(response.choices[0].message.content);

      // Add required metadata
      dynamicFramework.id = "dynamic-" + Date.now();
      dynamicFramework.category = "AI-Generated";
      dynamicFramework.source = "dynamic-creation";
      dynamicFramework.token_estimate = 200;
      dynamicFramework.output_formats = [analysis.output_type || "markdown"];
      dynamicFramework.platforms = ["ChatGPT", "Claude", "Gemini"];
      dynamicFramework.models = ["GPT-4o", "Claude-3 Opus", "Gemini-1.5 Pro"];

      logger.info("✅ Created dynamic framework:", dynamicFramework.name);
      return dynamicFramework;
    } catch (error) {
      logger.error("❌ Dynamic framework creation failed:", error);

      // Fallback to generic framework
      return {
        id: "generic-fallback",
        name: "Structured Problem Solving",
        description: "A flexible approach for any challenge",
        base_prompt: `Approach this systematically: 1) Understand the specific request: "${userRequest}", 2) Analyze all requirements and constraints, 3) Develop a comprehensive solution, 4) Provide actionable recommendations with clear next steps.`,
        category: "Fallback",
        token_estimate: 150,
        output_formats: ["markdown"],
        platforms: ["ChatGPT"],
        models: ["GPT-4o"],
      };
    }
  }

  async generateAIPurePrompt(userRequest) {
    try {
      logger.info("🎯 Generating pure AI prompt for:", userRequest);

      const purePromptGenerator = `
You are an expert prompt engineer. Create a highly optimized, professional prompt for this request:
"${userRequest}"

Make the prompt:
- Highly specific and actionable for this exact request
- Structured for the best possible AI response
- Include relevant context, constraints, and success criteria
- Optimized for the specific type of request
- Professional and comprehensive

Return ONLY the optimized prompt, nothing else.
`;

      const response = await this.getOpenAI().chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: purePromptGenerator }],
        temperature: 0.2,
        max_tokens: 800,
      });

      return {
        prompt: response.choices[0].message.content,
        metadata: {
          framework: "Pure AI Generation",
          approach: "ai-optimized",
          estimatedTokens: Math.ceil(
            response.choices[0].message.content.length / 4
          ),
          outputFormat: "optimized",
          confidence: "high",
        },
      };
    } catch (error) {
      logger.error("❌ Pure AI prompt generation failed:", error);

      // Ultimate fallback
      return {
        prompt: `Please provide a comprehensive and helpful response to this request: "${userRequest}". Consider all relevant aspects and provide actionable guidance.`,
        metadata: {
          framework: "Emergency Fallback",
          approach: "basic-fallback",
          estimatedTokens: 50,
        },
      };
    }
  }

  async generateIntelligentRecommendations(userRequest) {
    try {
      logger.info(`🚀 Starting intelligent analysis for: "${userRequest}"`);

      // Step 1: Analyze intent with AI
      const analysis = await this.analyzeUserIntent(userRequest);

      // Step 2: Find relevant frameworks
      const frameworks = await this.recommendFrameworks(analysis);

      // Step 3: Select best framework
      const selectedFramework = frameworks[0];

      if (!selectedFramework) {
        throw new Error("No suitable framework found for this request");
      }

      // Step 4: Get intelligent format recommendations
      const formatRec = this.getIntelligentOutputFormats(
        analysis,
        selectedFramework
      );

      // Step 5: Get optimal platform/model recommendations
      const platformRec = await this.getOptimalPlatformAndModel(
        analysis,
        selectedFramework
      );

      // Step 6: Compile intelligent recommendations
      const recommendations = {
        analysis: analysis,
        recommendedFramework: selectedFramework,
        alternativeFrameworks: frameworks.slice(1, 4), // Top 3 alternatives
        formatRecommendation: formatRec,
        platformRecommendation: platformRec,
        autoFillData: {
          tone: analysis.tone_preference,
          role: analysis.suggested_role,
          outputFormat: formatRec.recommended,
          complexity: analysis.complexity,
          platform: platformRec.platform,
          model: platformRec.model,
        },
        confidence: {
          frameworkMatch: selectedFramework.relevanceScore || 0,
          intentCertainty: analysis.complexity === "simple" ? "high" : "medium",
        },
      };

      logger.info("✅ Intelligent recommendations generated successfully");
      return recommendations;
    } catch (error) {
      logger.error("❌ Intelligent recommendations failed:", error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }
}

// Export singleton instance
module.exports = IntentAnalyzer; // This exports the class
