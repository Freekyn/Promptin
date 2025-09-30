require("dotenv").config();
// services/intentAnalyzer.js - World-Class Adaptive AI-Powered Intent Analysis System
const OpenAI = require("openai");
const frameworkFinder = require("./frameworkFinder");
const logger = require("../utils/logger");
const NodeCache = require("node-cache");
const cosineSimilarity = require("cosine-similarity");

class WorldClassIntentAnalyzer {
  constructor() {
    this.openai = null;
    this.cache = new NodeCache({ stdTTL: 3600 }); // 1 hour cache
    this.embeddingsCache = new NodeCache({ stdTTL: 86400 }); // 24 hour embeddings cache
    this.feedbackLearner = new FeedbackLearner();
    this.dynamicCategories = new Set([
      "data_analysis",
      "content_creation",
      "problem_solving",
      "creative_writing",
      "technical",
      "research",
      "business_strategy",
      "marketing",
      "music",
      "entertainment",
      "education",
      "healthcare",
      "legal",
      "financial",
    ]);
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
      logger.info("🧠 Advanced intent analysis starting...");

      // Check cache first
      const cacheKey = `intent_${this.hashRequest(userRequest)}`;
      const cachedResult = this.cache.get(cacheKey);
      if (cachedResult) {
        logger.info("✅ Using cached intent analysis");
        return cachedResult;
      }

      // Select optimal model based on request complexity
      const model = await this.selectOptimalModel(userRequest);

      const analysisPrompt = `
You are an expert intent analyzer with deep understanding of user needs across all domains.

Analyze this user request with exceptional precision:
"${userRequest}"

Provide a comprehensive JSON analysis with:
1. "intent" - Primary goal (be specific and precise)
2. "secondary_intents" - Array of secondary goals if any
3. "domain" - Primary field/industry 
4. "sub_domains" - Related fields that might be relevant
5. "complexity" - "simple" | "medium" | "complex" | "expert"
6. "urgency" - "low" | "medium" | "high" | "critical"
7. "output_type" - Most suitable output format
8. "alternative_outputs" - Other possible output formats
9. "tone_preference" - Optimal tone for this request
10. "suggested_role" - Best expert role for this task
11. "alternative_roles" - Other suitable expert roles
12. "keywords" - Array of 5-10 highly relevant keywords
13. "semantic_concepts" - Abstract concepts related to the request
14. "reasoning_type" - Optimal reasoning approach
15. "context_requirements" - What context would improve the response
16. "success_criteria" - How to measure if the response is successful
17. "potential_challenges" - Possible difficulties in addressing this request
18. "confidence_score" - Your confidence in this analysis (0-100)
19. "novel_category" - If this doesn't fit existing categories, suggest a new one

Return only valid JSON with no explanations.`;

      const response = await this.getOpenAI().chat.completions.create({
        model: model,
        messages: [{ role: "user", content: analysisPrompt }],
        temperature: 0.2,
        max_tokens: 800,
        response_format: { type: "json_object" },
      });

      let analysis = JSON.parse(response.choices[0].message.content);

      // Learn new categories dynamically
      if (analysis.novel_category && analysis.confidence_score > 80) {
        this.dynamicCategories.add(analysis.novel_category);
        logger.info(`🆕 Learned new category: ${analysis.novel_category}`);
      }

      // Apply feedback learning adjustments
      analysis = await this.feedbackLearner.adjustAnalysis(
        analysis,
        userRequest
      );

      // Cache the result
      this.cache.set(cacheKey, analysis);

      logger.info("✅ Advanced intent analysis complete:", {
        intent: analysis.intent,
        confidence: analysis.confidence_score,
        model: model,
      });

      return analysis;
    } catch (error) {
      logger.error("❌ Advanced intent analysis failed:", error);
      return this.enhancedFallbackAnalysis(userRequest);
    }
  }

  async selectOptimalModel(userRequest) {
    // Intelligent model selection based on request characteristics
    const requestLength = userRequest.length;
    const hasCode = /```|function|class|def|import|require/.test(userRequest);
    const isComplex = /analyze|compare|evaluate|strategy|comprehensive/.test(
      userRequest.toLowerCase()
    );
    const needsLatest = /latest|current|2024|2025|recent/.test(
      userRequest.toLowerCase()
    );

    if (needsLatest || isComplex || requestLength > 500) {
      return "gpt-4o"; // Most capable for complex/current tasks
    } else if (hasCode) {
      return "gpt-4-turbo"; // Good for code-related tasks
    } else {
      return "gpt-4o-mini"; // Efficient for simpler tasks
    }
  }

  async recommendFrameworks(analysis, userRequest, limit = 5) {
    try {
      logger.info("🔍 Finding relevant frameworks...");

      // Phase 1: Keyword-based search (FAST and EFFECTIVE)
      let frameworks = [];

      // Search with primary keywords
      for (const keyword of analysis.keywords.slice(0, 3)) {
        // Limit keywords
        const results = await frameworkFinder.findFrameworks(keyword, {
          maxResults: 10,
          threshold: 0.5,
        });
        frameworks.push(...results);
      }

      // Deduplicate
      frameworks = this.deduplicateFrameworks(frameworks);

      // Phase 2: Score and rank frameworks
      const scoredFrameworks = await this.advancedFrameworkScoring(
        frameworks,
        analysis,
        userRequest
      );

      // Phase 3: If we have good matches, return them
      if (
        scoredFrameworks.length >= 3 &&
        scoredFrameworks[0].relevanceScore > 70
      ) {
        logger.info(`✅ Found ${scoredFrameworks.length} relevant frameworks`);
        return scoredFrameworks.slice(0, limit);
      }

      // Phase 4: If no good matches, do ONE semantic search on top candidates only
      if (scoredFrameworks.length > 0) {
        const topCandidate = scoredFrameworks[0];
        try {
          const requestEmbedding = await this.getEmbedding(userRequest);
          const candidateText = `${topCandidate.name} ${
            topCandidate.description || ""
          }`;
          const candidateEmbedding = await this.getEmbedding(candidateText);

          if (requestEmbedding && candidateEmbedding) {
            const similarity = cosineSimilarity(
              requestEmbedding,
              candidateEmbedding
            );
            topCandidate.semanticScore = similarity;
            topCandidate.relevanceScore = Math.min(
              100,
              topCandidate.relevanceScore + similarity * 20
            );
          }
        } catch (err) {
          logger.debug("Semantic enhancement skipped:", err.message);
        }
      }

      logger.info(
        `✅ Returning ${Math.min(scoredFrameworks.length, limit)} frameworks`
      );
      return scoredFrameworks.slice(0, limit);
    } catch (error) {
      logger.error("❌ Framework recommendation failed:", error);
      return [];
    }
  }
  async semanticFrameworkSearch(userRequest, analysis) {
    try {
      const allFrameworks = (await frameworkFinder.getAllFrameworks()) || [];
      if (allFrameworks.length === 0) return [];

      // Smart filtering: Only get embeddings for frameworks that are relevant
      // based on category and domain matching
      const relevantFrameworks = allFrameworks.filter((framework) => {
        const categoryMatch =
          analysis.domain &&
          framework.category &&
          framework.category
            .toLowerCase()
            .includes(analysis.domain.toLowerCase());
        const domainMatch =
          framework.domain_tags &&
          analysis.domain &&
          framework.domain_tags.includes(analysis.domain);
        const keywordMatch = analysis.keywords.some((keyword) =>
          (framework.name + framework.description)
            .toLowerCase()
            .includes(keyword.toLowerCase())
        );

        // Include if any relevance indicator matches
        return categoryMatch || domainMatch || keywordMatch;
      });

      // If no relevant frameworks found, take top 100 by general relevance
      const frameworksToCheck =
        relevantFrameworks.length > 0
          ? relevantFrameworks
          : allFrameworks.slice(0, 100);

      logger.info(
        `Semantic search on ${frameworksToCheck.length} relevant frameworks out of ${allFrameworks.length} total`
      );

      // Get embedding for user request
      const requestEmbedding = await this.getEmbedding(userRequest);
      if (!requestEmbedding) return [];

      // Parallel processing with batching to avoid timeout
      const batchSize = 10;
      const semanticMatches = [];

      for (let i = 0; i < frameworksToCheck.length; i += batchSize) {
        const batch = frameworksToCheck.slice(i, i + batchSize);
        const batchPromises = batch.map(async (framework) => {
          try {
            const frameworkText = `${framework.name} ${
              framework.description || ""
            } ${framework.category || ""}`;
            const frameworkEmbedding = await this.getCachedEmbedding(
              frameworkText
            );

            if (frameworkEmbedding) {
              const similarity = cosineSimilarity(
                requestEmbedding,
                frameworkEmbedding
              );
              if (similarity > 0.65) {
                // Slightly lower threshold for better coverage
                return {
                  ...framework,
                  semanticScore: similarity,
                };
              }
            }
          } catch (err) {
            return null;
          }
        });

        const batchResults = await Promise.all(batchPromises);
        semanticMatches.push(...batchResults.filter((r) => r !== null));
      }

      return semanticMatches.sort((a, b) => b.semanticScore - a.semanticScore);
    } catch (error) {
      logger.error("Semantic search failed:", error);
      return [];
    }
  }
  async getEmbedding(text) {
    try {
      const response = await this.getOpenAI().embeddings.create({
        model: "text-embedding-3-small",
        input: text,
      });
      return response.data[0].embedding;
    } catch (error) {
      logger.error("Failed to get embedding:", error);
      return null;
    }
  }

  async getCachedEmbedding(text) {
    const cacheKey = `emb_${this.hashRequest(text)}`;
    const cached = this.embeddingsCache.get(cacheKey);
    if (cached) return cached;

    const embedding = await this.getEmbedding(text);
    if (embedding) {
      this.embeddingsCache.set(cacheKey, embedding);
    }
    return embedding;
  }

  async advancedFrameworkScoring(frameworks, analysis, userRequest) {
    const scoredFrameworks = [];

    for (const framework of frameworks) {
      let score = 0;
      let confidenceFactors = {};

      // 1. Domain alignment (20%)
      if (framework.domain_tags?.includes(analysis.domain)) {
        score += 20;
        confidenceFactors.domainMatch = 100;
      } else if (
        analysis.sub_domains?.some((d) => framework.domain_tags?.includes(d))
      ) {
        score += 10;
        confidenceFactors.domainMatch = 50;
      }

      // 2. Intent alignment (25%)
      const intentMatch = this.calculateIntentAlignment(framework, analysis);
      score += intentMatch * 25;
      confidenceFactors.intentAlignment = intentMatch * 100;

      // 3. Complexity match (15%)
      if (framework.complexity_level === analysis.complexity) {
        score += 15;
        confidenceFactors.complexityMatch = 100;
      } else if (
        this.isComplexityCompatible(
          framework.complexity_level,
          analysis.complexity
        )
      ) {
        score += 8;
        confidenceFactors.complexityMatch = 50;
      }

      // 4. Output format compatibility (15%)
      const outputScore = this.calculateOutputCompatibility(
        framework,
        analysis
      );
      score += outputScore * 15;
      confidenceFactors.outputCompatibility = outputScore * 100;

      // 5. Semantic relevance (15%)
      if (framework.semanticScore) {
        score += framework.semanticScore * 15;
        confidenceFactors.semanticRelevance = framework.semanticScore * 100;
      }

      // 6. Success criteria alignment (10%)
      const successAlignment = await this.calculateSuccessAlignment(
        framework,
        analysis
      );
      score += successAlignment * 10;
      confidenceFactors.successAlignment = successAlignment * 100;

      // Calculate overall confidence
      const confidence =
        Object.values(confidenceFactors).reduce((a, b) => a + b, 0) /
        Object.keys(confidenceFactors).length;

      scoredFrameworks.push({
        ...framework,
        relevanceScore: Math.round(score),
        confidence: Math.round(confidence),
        confidenceFactors,
        matchExplanation: this.generateMatchExplanation(confidenceFactors),
      });
    }

    return scoredFrameworks.sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  calculateIntentAlignment(framework, analysis) {
    const frameworkText =
      `${framework.name} ${framework.description}`.toLowerCase();
    const primaryIntentMatch = frameworkText.includes(
      analysis.intent.toLowerCase()
    )
      ? 1
      : 0;

    let secondaryMatches = 0;
    if (analysis.secondary_intents) {
      secondaryMatches =
        analysis.secondary_intents.filter((intent) =>
          frameworkText.includes(intent.toLowerCase())
        ).length / analysis.secondary_intents.length;
    }

    return primaryIntentMatch * 0.7 + secondaryMatches * 0.3;
  }

  async createDynamicFramework(analysis, userRequest) {
    try {
      logger.info("🔧 Creating advanced dynamic framework...");

      const model = "gpt-4o"; // Use most capable model for framework creation

      const dynamicFrameworkPrompt = `
You are an expert framework designer. Create a comprehensive, world-class framework for this request:
"${userRequest}"

Analysis insights:
- Intent: ${analysis.intent}
- Domain: ${analysis.domain}
- Complexity: ${analysis.complexity}
- Success Criteria: ${JSON.stringify(analysis.success_criteria)}
- Challenges: ${JSON.stringify(analysis.potential_challenges)}

Create a framework that:
1. Addresses all aspects of the request with precision
2. Incorporates best practices from the ${analysis.domain} domain
3. Provides clear, actionable steps
4. Anticipates and handles edge cases
5. Optimizes for the desired output: ${analysis.output_type}

Return JSON with:
{
  "name": "Specific, memorable framework name",
  "description": "Clear description of the framework's purpose and benefits",
  "base_prompt": "Comprehensive, structured prompt that guides step-by-step execution",
  "methodology": ["step1_with_substeps", "step2_with_substeps", ...],
  "key_principles": ["principle1", "principle2", ...],
  "success_metrics": ["metric1", "metric2", ...],
  "common_pitfalls": ["pitfall1", "pitfall2", ...],
  "optimization_tips": ["tip1", "tip2", ...],
  "example_application": "Brief example of how to apply this framework",
  "adaptations": {
    "simple": "How to simplify for basic use",
    "advanced": "How to extend for complex scenarios"
  }
}`;

      const response = await this.getOpenAI().chat.completions.create({
        model: model,
        messages: [{ role: "user", content: dynamicFrameworkPrompt }],
        temperature: 0.3,
        max_tokens: 1500,
        response_format: { type: "json_object" },
      });

      const dynamicFramework = JSON.parse(response.choices[0].message.content);

      // Enhance with metadata
      dynamicFramework.id = `dynamic-${Date.now()}-${this.hashRequest(
        userRequest
      ).substring(0, 8)}`;
      dynamicFramework.category = analysis.domain;
      dynamicFramework.source = "ai-generated";
      dynamicFramework.complexity_level = analysis.complexity;
      dynamicFramework.domain_tags = [
        analysis.domain,
        ...(analysis.sub_domains || []),
      ];
      dynamicFramework.token_estimate = Math.ceil(
        dynamicFramework.base_prompt.length / 4
      );
      dynamicFramework.output_formats = [
        analysis.output_type,
        ...(analysis.alternative_outputs || []),
      ];
      dynamicFramework.platforms = this.determinePlatforms(analysis);
      dynamicFramework.models = this.determineModels(analysis);
      dynamicFramework.confidence_score = 95; // High confidence for custom-created frameworks
      dynamicFramework.created_at = new Date().toISOString();

      // Store in database for future use
      await this.storeDynamicFramework(dynamicFramework);

      logger.info(
        "✅ Created advanced dynamic framework:",
        dynamicFramework.name
      );
      return dynamicFramework;
    } catch (error) {
      logger.error("❌ Dynamic framework creation failed:", error);
      return this.createFailsafeFramework(analysis, userRequest);
    }
  }

  determinePlatforms(analysis) {
    const platforms = ["ChatGPT", "Claude", "Gemini"];

    if (analysis.output_type === "image" || analysis.domain === "creative") {
      platforms.push("Midjourney", "DALL-E");
    }
    if (analysis.output_type === "code" || analysis.domain === "technical") {
      platforms.push("GitHub Copilot", "Cursor");
    }
    if (analysis.output_type === "video") {
      platforms.push("Sora", "Runway");
    }

    return platforms;
  }

  determineModels(analysis) {
    const models = [];

    // Add GPT models
    if (analysis.complexity === "expert" || analysis.urgency === "critical") {
      models.push("GPT-4o", "GPT-4-turbo");
    } else {
      models.push("GPT-4o-mini", "GPT-4o");
    }

    // Add Claude models
    if (
      analysis.reasoning_type === "chain_of_thought" ||
      analysis.domain === "research"
    ) {
      models.push("Claude-3-Opus", "Claude-3-Sonnet");
    }

    // Add Gemini models
    if (
      analysis.domain === "data_analysis" ||
      analysis.output_type === "code"
    ) {
      models.push("Gemini-1.5-Pro", "Gemini-1.5-Flash");
    }

    // Add specialized models
    if (analysis.output_type === "image") {
      models.push("DALL-E 3", "Midjourney v6", "Stable Diffusion XL");
    }

    return [...new Set(models)]; // Remove duplicates
  }

  async storeDynamicFramework(framework) {
    try {
      // This would integrate with your frameworkFinder service to store in database
      await frameworkFinder.addDynamicFramework(framework);
      logger.info(`💾 Stored dynamic framework: ${framework.name}`);
    } catch (error) {
      logger.error("Failed to store dynamic framework:", error);
      // Continue execution even if storage fails
    }
  }

  generateMatchExplanation(confidenceFactors) {
    const explanations = [];

    if (confidenceFactors.domainMatch >= 80) {
      explanations.push("Strong domain alignment");
    }
    if (confidenceFactors.intentAlignment >= 80) {
      explanations.push("Excellent intent match");
    }
    if (confidenceFactors.semanticRelevance >= 80) {
      explanations.push("High semantic relevance");
    }
    if (confidenceFactors.complexityMatch === 100) {
      explanations.push("Perfect complexity fit");
    }

    return (
      explanations.join(", ") || "Moderate match based on multiple factors"
    );
  }

  hashRequest(text) {
    const crypto = require("crypto");
    return crypto.createHash("md5").update(text).digest("hex");
  }

  deduplicateFrameworks(frameworks) {
    if (!Array.isArray(frameworks)) {
      logger.warn("deduplicateFrameworks received non-array input");
      return [];
    }

    const seen = new Map(); // Use Map for better tracking
    const deduplicated = [];

    for (const framework of frameworks) {
      // Skip invalid frameworks
      if (!framework || typeof framework !== "object") {
        logger.debug("Skipping invalid framework entry");
        continue;
      }

      // Generate a unique key based on available identifiers
      let key;
      if (framework.id) {
        key = `id_${framework.id}`;
      } else if (framework.name) {
        key = `name_${framework.name}`;
      } else if (framework.base_prompt) {
        // Use hash of base_prompt as last resort
        key = `prompt_${this.hashRequest(framework.base_prompt).substring(
          0,
          8
        )}`;
      } else {
        logger.debug("Framework has no valid identifier, skipping");
        continue;
      }

      // Check if we've seen this framework
      if (seen.has(key)) {
        // If duplicate, keep the one with higher relevance score
        const existing = seen.get(key);
        if (
          framework.relevanceScore > existing.relevanceScore ||
          framework.semanticScore > existing.semanticScore
        ) {
          // Replace with better scoring version
          const index = deduplicated.indexOf(existing);
          deduplicated[index] = framework;
          seen.set(key, framework);
        }
      } else {
        // New framework, add it
        seen.set(key, framework);
        deduplicated.push(framework);
      }
    }

    logger.debug(
      `Deduplicated ${frameworks.length} frameworks to ${deduplicated.length}`
    );
    return deduplicated;
  }

  isComplexityCompatible(frameworkComplexity, requestComplexity) {
    const complexityLevels = ["simple", "medium", "complex", "expert"];
    const frameworkLevel = complexityLevels.indexOf(frameworkComplexity);
    const requestLevel = complexityLevels.indexOf(requestComplexity);

    // Framework can handle ±1 complexity level
    return Math.abs(frameworkLevel - requestLevel) <= 1;
  }

  calculateOutputCompatibility(framework, analysis) {
    if (!framework.output_formats) return 0;

    const formats = this.parseOutputFormats(framework.output_formats);
    const desiredFormat = analysis.output_type.toLowerCase();
    const alternativeFormats = (analysis.alternative_outputs || []).map((f) =>
      f.toLowerCase()
    );

    // Check primary format match
    if (formats.some((f) => f.toLowerCase() === desiredFormat)) {
      return 1.0;
    }

    // Check alternative format matches
    const alternativeMatches = alternativeFormats.filter((alt) =>
      formats.some((f) => f.toLowerCase() === alt)
    ).length;

    if (alternativeMatches > 0) {
      return 0.5 + (alternativeMatches / alternativeFormats.length) * 0.3;
    }

    // Partial match based on similarity
    const partialMatch = formats.some(
      (f) =>
        f.toLowerCase().includes(desiredFormat) ||
        desiredFormat.includes(f.toLowerCase())
    );

    return partialMatch ? 0.3 : 0;
  }

  async calculateSuccessAlignment(framework, analysis) {
    if (!analysis.success_criteria || analysis.success_criteria.length === 0) {
      return 0.5; // Default alignment
    }

    const frameworkText =
      `${framework.name} ${framework.description} ${framework.base_prompt}`.toLowerCase();

    let alignmentScore = 0;
    for (const criterion of analysis.success_criteria) {
      if (frameworkText.includes(criterion.toLowerCase())) {
        alignmentScore += 1;
      }
    }

    return alignmentScore / analysis.success_criteria.length;
  }

  parseOutputFormats(outputFormats) {
    if (!outputFormats) return ["Txt"];

    if (typeof outputFormats === "string") {
      try {
        return JSON.parse(outputFormats);
      } catch {
        return outputFormats.split(/[\s,;]+/).filter((f) => f.length > 0);
      }
    }

    if (Array.isArray(outputFormats)) {
      return outputFormats;
    }

    return ["Txt"];
  }

  async getOptimalPlatformAndModel(analysis, selectedFramework) {
    try {
      const platforms = this.parseOutputFormats(selectedFramework.platforms);
      const models = this.parseOutputFormats(selectedFramework.models);

      // Advanced model selection based on multiple factors
      const modelScores = {};

      // Score each available model
      for (const model of models) {
        let score = 0;

        // Intent-based scoring
        if (
          analysis.intent === "data_analysis" &&
          model.includes("Claude-3-Opus")
        )
          score += 30;
        if (analysis.intent === "creative_writing" && model.includes("GPT-4o"))
          score += 30;
        if (analysis.intent === "technical" && model.includes("GPT-4"))
          score += 25;
        if (analysis.intent === "research" && model.includes("Claude"))
          score += 25;

        // Complexity-based scoring
        if (
          analysis.complexity === "expert" &&
          (model.includes("Opus") || model.includes("GPT-4o"))
        )
          score += 20;
        if (analysis.complexity === "simple" && model.includes("mini"))
          score += 15;

        // Urgency-based scoring
        if (analysis.urgency === "critical" && !model.includes("mini"))
          score += 15;

        // Output type scoring
        if (analysis.output_type === "code" && model.includes("GPT-4"))
          score += 20;
        if (analysis.output_type === "analysis" && model.includes("Claude"))
          score += 20;

        modelScores[model] = score;
      }

      // Select best model
      const sortedModels = Object.entries(modelScores).sort(
        (a, b) => b[1] - a[1]
      );
      const recommendedModel = sortedModels[0]?.[0] || "GPT-4o";

      // Determine platform based on model
      let recommendedPlatform = "ChatGPT";
      if (recommendedModel.includes("Claude")) recommendedPlatform = "Claude";
      else if (recommendedModel.includes("Gemini"))
        recommendedPlatform = "Gemini";
      else if (recommendedModel.includes("Midjourney"))
        recommendedPlatform = "Midjourney";

      // Special cases for media generation
      if (analysis.output_type === "image") {
        recommendedPlatform = "Midjourney";
        recommendedModel = "Midjourney v6";
      } else if (analysis.output_type === "video") {
        recommendedPlatform = "Sora";
        recommendedModel = "Sora v1";
      }

      return {
        platform: recommendedPlatform,
        model: recommendedModel,
        confidence: sortedModels[0]?.[1] || 50,
        alternatives: {
          platforms: platforms.slice(0, 3),
          models: sortedModels.slice(1, 4).map((m) => m[0]),
        },
        reasoning: this.generateModelReasoning(analysis, recommendedModel),
        modelScores: modelScores,
      };
    } catch (error) {
      logger.error("❌ Platform recommendation failed:", error);
      return {
        platform: "ChatGPT",
        model: "GPT-4o",
        confidence: 70,
        alternatives: { platforms: [], models: [] },
        reasoning: "Default selection with high capability",
      };
    }
  }

  generateModelReasoning(analysis, model) {
    const reasons = [];

    if (model.includes("GPT-4o")) {
      reasons.push("Latest GPT-4 optimized for speed and capability");
    }
    if (model.includes("Claude") && analysis.intent === "research") {
      reasons.push("Claude excels at research and analytical tasks");
    }
    if (analysis.complexity === "expert") {
      reasons.push("Selected most capable model for expert-level complexity");
    }
    if (analysis.urgency === "critical") {
      reasons.push("Prioritized reliability for critical urgency");
    }

    return reasons.join(". ") || `Selected ${model} for optimal performance`;
  }

  async generateIntelligentRecommendations(userRequest) {
    try {
      logger.info(`🚀 Starting world-class analysis for: "${userRequest}"`);

      // Step 1: Advanced AI analysis
      const analysis = await this.analyzeUserIntent(userRequest);

      // Step 2: Hybrid framework search
      const frameworks = await this.recommendFrameworks(analysis, userRequest);

      // Step 3: Select best framework or create dynamic one
      let selectedFramework;
      let approachType;

      if (frameworks.length > 0 && frameworks[0].confidence > 70) {
        selectedFramework = frameworks[0];
        approachType = "framework-matched";
      } else {
        // Create dynamic framework when no good matches
        selectedFramework = await this.createDynamicFramework(
          analysis,
          userRequest
        );
        approachType = "ai-generated";
      }

      // Step 4: Get intelligent format recommendations
      const formatRec = this.getIntelligentOutputFormats(
        analysis,
        selectedFramework
      );

      // Step 5: Get optimal platform/model with confidence scoring
      const platformRec = await this.getOptimalPlatformAndModel(
        analysis,
        selectedFramework
      );

      // Step 6: Generate prompt variations
      const promptVariations = await this.generatePromptVariations(
        selectedFramework,
        analysis,
        userRequest
      );

      // Step 7: Compile comprehensive recommendations
      const recommendations = {
        analysis: {
          ...analysis,
          categories: {
            primary: analysis.intent,
            secondary: analysis.secondary_intents || [],
            suggested_new: analysis.novel_category,
          },
        },
        framework: {
          selected: selectedFramework,
          confidence:
            selectedFramework.confidence || selectedFramework.relevanceScore,
          matchExplanation: selectedFramework.matchExplanation,
          approach: approachType,
          alternatives: frameworks.slice(1, 4).map((f) => ({
            ...f,
            differentiator: this.explainFrameworkDifference(
              f,
              selectedFramework
            ),
          })),
        },
        recommendations: {
          format: {
            ...formatRec,
            confidence: this.calculateFormatConfidence(formatRec, analysis),
          },
          platform: {
            ...platformRec,
            costEstimate: this.estimateCost(platformRec.model, analysis),
          },
        },
        promptVariations: promptVariations,
        autoFillData: {
          tone: analysis.tone_preference,
          role: analysis.suggested_role,
          outputFormat: formatRec.recommended,
          complexity: analysis.complexity,
          platform: platformRec.platform,
          model: platformRec.model,
          temperature: this.recommendTemperature(analysis),
          maxTokens: this.recommendMaxTokens(analysis),
        },
        metadata: {
          analysisVersion: "2.0",
          confidence: {
            overall: this.calculateOverallConfidence(
              analysis,
              selectedFramework,
              platformRec
            ),
            breakdown: {
              intentAnalysis: analysis.confidence_score,
              frameworkMatch: selectedFramework.confidence || 95,
              modelSelection: platformRec.confidence,
            },
          },
          processingInsights: {
            modelsConsidered: Object.keys(platformRec.modelScores || {}),
            frameworksEvaluated: frameworks.length,
            semanticSearchUsed: true,
            feedbackLearningApplied: true,
          },
        },
      };

      // Record for learning
      await this.feedbackLearner.recordRecommendation(
        userRequest,
        recommendations
      );

      logger.info("✅ World-class recommendations generated successfully");
      return recommendations;
    } catch (error) {
      logger.error("❌ Recommendation generation failed:", error);
      throw new Error(`Failed to generate recommendations: ${error.message}`);
    }
  }

  async generatePromptVariations(framework, analysis, userRequest) {
    try {
      const variations = [];

      // Variation 1: Standard approach
      variations.push({
        name: "Standard",
        prompt: framework.base_prompt.replace("{USER_REQUEST}", userRequest),
        focus: "Balanced approach",
      });

      // Variation 2: Detailed approach
      variations.push({
        name: "Comprehensive",
        prompt: `${
          framework.base_prompt
        }\n\nProvide extensive detail for: ${userRequest}\n\nInclude: ${
          analysis.context_requirements || "all relevant context"
        }`,
        focus: "Maximum detail and depth",
      });

      // Variation 3: Quick approach
      if (analysis.urgency === "high" || analysis.urgency === "critical") {
        variations.push({
          name: "Rapid",
          prompt: `Quickly address: ${userRequest}\n\nKey points only. ${
            framework.methodology
              ? "Focus on: " + framework.methodology.slice(0, 2).join(", ")
              : ""
          }`,
          focus: "Speed and key insights",
        });
      }

      // Variation 4: Creative approach
      if (
        analysis.domain === "creative" ||
        analysis.intent === "creative_writing"
      ) {
        variations.push({
          name: "Creative",
          prompt: `${framework.base_prompt}\n\nApproach creatively: ${userRequest}\n\nEmphasize originality and innovation.`,
          focus: "Maximum creativity",
        });
      }

      return variations.slice(0, 3); // Return top 3 variations
    } catch (error) {
      logger.error("Failed to generate variations:", error);
      return [
        {
          name: "Default",
          prompt: framework.base_prompt,
          focus: "Standard approach",
        },
      ];
    }
  }

  calculateFormatConfidence(formatRec, analysis) {
    let confidence = 50; // Base confidence

    if (formatRec.recommended === analysis.output_type) {
      confidence += 30;
    }
    if (
      formatRec.suggested &&
      formatRec.suggested.includes(formatRec.recommended)
    ) {
      confidence += 20;
    }

    return Math.min(confidence, 100);
  }

  estimateCost(model, analysis) {
    // Rough cost estimates per 1K tokens
    const costMap = {
      "GPT-4o": 0.005,
      "GPT-4o-mini": 0.00015,
      "GPT-4-turbo": 0.01,
      "Claude-3-Opus": 0.015,
      "Claude-3-Sonnet": 0.003,
      "Gemini-1.5-Pro": 0.0035,
      "Gemini-1.5-Flash": 0.00035,
    };

    const baseCost = costMap[model] || 0.005;
    const estimatedTokens =
      analysis.complexity === "expert"
        ? 4000
        : analysis.complexity === "complex"
        ? 2000
        : analysis.complexity === "medium"
        ? 1000
        : 500;

    return {
      estimated: `${((baseCost * estimatedTokens) / 1000).toFixed(3)}`,
      tokens: estimatedTokens,
      model: model,
    };
  }

  recommendTemperature(analysis) {
    if (
      analysis.intent === "creative_writing" ||
      analysis.domain === "creative"
    ) {
      return 0.8;
    } else if (
      analysis.intent === "data_analysis" ||
      analysis.intent === "technical"
    ) {
      return 0.2;
    } else if (analysis.complexity === "expert") {
      return 0.3;
    }
    return 0.5; // Default balanced temperature
  }

  recommendMaxTokens(analysis) {
    const baseTokens = {
      simple: 500,
      medium: 1500,
      complex: 3000,
      expert: 4000,
    };

    let tokens = baseTokens[analysis.complexity] || 1500;

    // Adjust based on output type
    if (analysis.output_type === "code") tokens *= 1.5;
    if (analysis.output_type === "report") tokens *= 2;
    if (analysis.output_type === "summary") tokens *= 0.5;

    return Math.min(Math.round(tokens), 8000);
  }

  calculateOverallConfidence(analysis, framework, platformRec) {
    const weights = {
      analysis: 0.3,
      framework: 0.4,
      platform: 0.3,
    };

    const scores = {
      analysis: analysis.confidence_score || 70,
      framework: framework.confidence || framework.relevanceScore || 70,
      platform: platformRec.confidence || 70,
    };

    const weighted =
      scores.analysis * weights.analysis +
      scores.framework * weights.framework +
      scores.platform * weights.platform;

    return Math.round(weighted);
  }

  explainFrameworkDifference(alternative, selected) {
    const differences = [];

    if (alternative.category !== selected.category) {
      differences.push(
        `Different approach: ${alternative.category} vs ${selected.category}`
      );
    }
    if (alternative.complexity_level !== selected.complexity_level) {
      differences.push(`${alternative.complexity_level} complexity`);
    }
    if (alternative.relevanceScore < selected.relevanceScore) {
      differences.push(
        `${Math.round(
          selected.relevanceScore - alternative.relevanceScore
        )}% lower match`
      );
    }

    return differences.join(", ") || "Similar alternative approach";
  }

  getIntelligentOutputFormats(analysis, selectedFramework) {
    try {
      const frameworkFormats = this.parseOutputFormats(
        selectedFramework.output_formats
      );

      // Advanced format mapping with context awareness
      const contextualFormatMapping = {
        data_analysis: {
          primary: ["Dashboard", "Excel", "Jupyter Notebook"],
          secondary: ["Report", "Visualization", "CSV"],
          context: "Data visualization and analysis",
        },
        content_creation: {
          primary: ["Article", "Blog Post", "Website"],
          secondary: ["PDF", "Markdown", "Social Media"],
          context: "Content for publication",
        },
        technical: {
          primary: ["Code", "API Documentation", "Technical Spec"],
          secondary: ["Runbook", "README", "Diagram"],
          context: "Technical documentation",
        },
        creative_writing: {
          primary: ["Story", "Script", "Narrative"],
          secondary: ["Dialogue", "Character Profile", "Plot Outline"],
          context: "Creative content",
        },
        business_strategy: {
          primary: ["Strategic Plan", "Presentation", "Executive Summary"],
          secondary: ["SWOT Analysis", "Roadmap", "Business Model Canvas"],
          context: "Business planning",
        },
        research: {
          primary: ["Research Paper", "Literature Review", "Meta-Analysis"],
          secondary: ["Abstract", "Methodology", "Bibliography"],
          context: "Academic research",
        },
      };

      const intentFormats = contextualFormatMapping[analysis.intent] || {
        primary: ["Document", "Report"],
        secondary: ["Summary", "List"],
        context: "General purpose",
      };

      // Intelligent format selection
      const recommendedFormats = this.selectOptimalFormats(
        frameworkFormats,
        intentFormats,
        analysis
      );

      return {
        recommended: recommendedFormats.primary,
        available: recommendedFormats.all,
        alternatives: recommendedFormats.secondary,
        context: intentFormats.context,
        compatibility: {
          framework: frameworkFormats,
          intent: [...intentFormats.primary, ...intentFormats.secondary],
          overlap: recommendedFormats.overlap,
        },
        suggestion: this.generateFormatSuggestion(recommendedFormats, analysis),
      };
    } catch (error) {
      logger.error("❌ Format analysis failed:", error);
      return {
        recommended: "Markdown",
        available: ["Markdown", "Text"],
        alternatives: ["PDF", "HTML"],
        context: "Default format",
        suggestion: "Using standard format due to analysis error",
      };
    }
  }

  selectOptimalFormats(frameworkFormats, intentFormats, analysis) {
    const overlap = frameworkFormats.filter((f) =>
      [...intentFormats.primary, ...intentFormats.secondary].some(
        (i) =>
          f.toLowerCase().includes(i.toLowerCase()) ||
          i.toLowerCase().includes(f.toLowerCase())
      )
    );

    let primary = overlap[0];
    if (!primary) {
      // No overlap, use intent-based selection
      primary =
        intentFormats.primary.find((f) =>
          frameworkFormats.some((ff) =>
            ff.toLowerCase().includes(f.split(" ")[0].toLowerCase())
          )
        ) ||
        frameworkFormats[0] ||
        "Markdown";
    }

    return {
      primary,
      secondary: overlap.slice(1, 4),
      all: [...new Set([primary, ...overlap, ...frameworkFormats.slice(0, 3)])],
      overlap: overlap.length,
    };
  }

  generateFormatSuggestion(formats, analysis) {
    if (formats.overlap > 2) {
      return `Strong format compatibility - ${formats.primary} is ideal for ${analysis.intent}`;
    } else if (formats.overlap > 0) {
      return `${formats.primary} recommended, with ${formats.secondary.length} alternatives available`;
    } else {
      return `Using ${formats.primary} - consider framework alternatives for better format match`;
    }
  }

  enhancedFallbackAnalysis(userRequest) {
    const request = userRequest.toLowerCase();

    // More sophisticated fallback with pattern matching
    const analysis = {
      intent: "general",
      secondary_intents: [],
      domain: "general",
      sub_domains: [],
      complexity: "medium",
      urgency: "medium",
      output_type: "document",
      alternative_outputs: ["report", "summary"],
      tone_preference: "professional",
      suggested_role: "Expert Consultant",
      alternative_roles: ["Analyst", "Advisor"],
      keywords: [],
      semantic_concepts: [],
      reasoning_type: "step_by_step",
      context_requirements: "Clear problem statement and objectives",
      success_criteria: [
        "Comprehensive solution",
        "Actionable recommendations",
      ],
      potential_challenges: ["Ambiguous requirements"],
      confidence_score: 60,
      novel_category: null,
    };

    // Pattern matching for various intents
    const patterns = {
      creative: /song|music|story|creative|artist|write|compose|design|art/,
      technical: /code|program|develop|software|api|algorithm|debug|implement/,
      data: /data|analyz|dashboard|metric|insight|statistic|trend|report/,
      business: /strategy|business|market|growth|revenue|competitive|plan/,
      research: /research|study|investigate|literature|academic|paper|thesis/,
      support: /help|issue|problem|error|fix|troubleshoot|resolve/,
    };

    // Match patterns and update analysis
    for (const [intent, pattern] of Object.entries(patterns)) {
      if (pattern.test(request)) {
        analysis.intent = intent + "_related";
        analysis.keywords.push(...(request.match(pattern) || []));
        break;
      }
    }

    // Extract potential keywords
    const words = request.split(/\s+/).filter((w) => w.length > 3);
    analysis.keywords.push(...words.slice(0, 5));
    analysis.keywords = [...new Set(analysis.keywords)];

    logger.info("Using enhanced fallback analysis");
    return analysis;
  }

  createFailsafeFramework(analysis, userRequest) {
    return {
      id: "failsafe-" + Date.now(),
      name: "Adaptive Problem-Solving Framework",
      description:
        "A flexible framework for addressing any request systematically",
      base_prompt: `Please help with: "${userRequest}"

Approach this systematically:
1. Understand the core request and objectives
2. Identify key requirements and constraints  
3. Develop a comprehensive solution
4. Provide clear, actionable recommendations
5. Address potential challenges or edge cases

Focus on delivering practical value while maintaining ${
        analysis.tone_preference || "professional"
      } tone.`,
      category: "Universal",
      complexity_level: analysis.complexity,
      domain_tags: ["general", "adaptive"],
      token_estimate: 200,
      output_formats: ["markdown", "document", "report"],
      platforms: ["ChatGPT", "Claude", "Gemini"],
      models: ["GPT-4o", "Claude-3-Opus", "Gemini-1.5-Pro"],
      confidence_score: 70,
      source: "failsafe-generation",
    };
  }
}

// Feedback Learning System
class FeedbackLearner {
  constructor() {
    this.feedbackData = new Map();
    this.adjustmentWeights = new Map();
  }

  async recordRecommendation(userRequest, recommendations) {
    const key = this.generateKey(userRequest);
    this.feedbackData.set(key, {
      recommendations,
      timestamp: Date.now(),
      feedback: null,
    });
  }

  async recordFeedback(userRequest, feedback) {
    const key = this.generateKey(userRequest);
    const data = this.feedbackData.get(key);
    if (data) {
      data.feedback = feedback;
      this.updateAdjustmentWeights(data);
    }
  }

  async adjustAnalysis(analysis, userRequest) {
    // Apply learned adjustments based on past feedback
    const similarRequests = this.findSimilarRequests(userRequest);

    if (similarRequests.length > 0) {
      // Adjust confidence based on historical performance
      const avgFeedback = this.calculateAverageFeedback(similarRequests);
      if (avgFeedback < 0.5) {
        analysis.confidence_score *= 0.8;
      } else if (avgFeedback > 0.8) {
        analysis.confidence_score = Math.min(
          analysis.confidence_score * 1.1,
          100
        );
      }
    }

    return analysis;
  }

  async rerankFrameworks(frameworks, analysis) {
    // Re-rank frameworks based on historical feedback
    return frameworks
      .map((framework) => {
        const historicalScore = this.getHistoricalScore(framework, analysis);
        framework.relevanceScore =
          framework.relevanceScore * 0.7 + historicalScore * 0.3;
        return framework;
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore);
  }

  updateAdjustmentWeights(data) {
    if (!data.feedback) return;

    const { recommendations, feedback } = data;
    const framework = recommendations.framework.selected;

    // Update weights based on feedback
    const key = `${framework.category}_${recommendations.analysis.intent}`;
    const currentWeight = this.adjustmentWeights.get(key) || 1.0;

    if (feedback.rating >= 4) {
      this.adjustmentWeights.set(key, Math.min(currentWeight * 1.05, 1.5));
    } else if (feedback.rating <= 2) {
      this.adjustmentWeights.set(key, Math.max(currentWeight * 0.95, 0.5));
    }
  }

  findSimilarRequests(userRequest) {
    const results = [];
    const requestWords = new Set(userRequest.toLowerCase().split(/\s+/));

    for (const [key, data] of this.feedbackData) {
      const storedWords = new Set(key.split("_"));
      const overlap = [...requestWords].filter((w) =>
        storedWords.has(w)
      ).length;

      if (overlap / requestWords.size > 0.5) {
        results.push(data);
      }
    }

    return results;
  }

  calculateAverageFeedback(similarRequests) {
    const withFeedback = similarRequests.filter((r) => r.feedback?.rating);
    if (withFeedback.length === 0) return 0.7; // Neutral default

    const sum = withFeedback.reduce((acc, r) => acc + r.feedback.rating, 0);
    return sum / withFeedback.length / 5; // Normalize to 0-1
  }

  getHistoricalScore(framework, analysis) {
    const key = `${framework.category}_${analysis.intent}`;
    const weight = this.adjustmentWeights.get(key) || 1.0;
    return 50 * weight; // Base score of 50, adjusted by weight
  }

  generateKey(userRequest) {
    return userRequest
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
      .slice(0, 5)
      .join("_");
  }
}

// Export singleton instance
// At the end of intentAnalyzer.js
module.exports = WorldClassIntentAnalyzer;
console.log("IntentAnalyzer export type:", typeof module.exports);
console.log("IntentAnalyzer export:", module.exports);
