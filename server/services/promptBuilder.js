// services/promptBuilder.js - Advanced Prompt Construction System
const UniversalPromptEnhancer = require("./universalPromptEnhancer");

class AdvancedPromptBuilder {
  constructor() {
    this.enhancer = UniversalPromptEnhancer;

    this.defaultOptions = {
      tone: "professional",
      outputFormat: "markdown",
      maxTokens: 2000,
      temperature: 0.7,
      useMetaPrompt: true,
      reasoning: "advanced",
    };

    this.availableOptions = {
      tones: [
        "professional",
        "casual",
        "technical",
        "creative",
        "analytical",
        "empathetic",
        "persuasive",
        "educational",
        "executive",
      ],
      outputFormats: [
        "markdown",
        "plain",
        "json",
        "html",
        "code",
        "email",
        "report",
        "presentation",
        "documentation",
      ],
      reasoningModes: [
        "chain_of_thought",
        "tree_of_thought",
        "react",
        "self_critique",
        "expert_panel",
        "socratic",
        "standard",
      ],
      roles: [
        "Expert Consultant",
        "Technical Architect",
        "Creative Director",
        "Data Scientist",
        "Strategic Advisor",
        "Research Analyst",
        "Product Manager",
        "Business Executive",
      ],
    };
  }

  /**
   * Main method - Build advanced meta-prompt
   */
  buildPrompt(framework, options = {}) {
    try {
      if (!framework) {
        throw new Error("Framework is required for prompt building");
      }

      const mergedOptions = { ...this.defaultOptions, ...options };

      // Extract and validate analysis
      const analysis = this.extractAnalysis(mergedOptions);

      // Generate meta-prompt using the enhancer
      const metaPromptResult = this.enhancer.generateEnhancedPrompt(
        mergedOptions.userInput || "",
        analysis,
        framework,
        {
          useMetaPrompt: mergedOptions.useMetaPrompt,
          includeExamples: mergedOptions.includeExamples || false,
          customInstructions: mergedOptions.customInstructions,
        }
      );

      // Enrich with additional context
      const enrichedPrompt = this.enrichPrompt(
        metaPromptResult.prompt,
        mergedOptions,
        framework
      );

      // Calculate comprehensive metadata
      const metadata = this.buildMetadata(
        enrichedPrompt,
        framework,
        mergedOptions,
        metaPromptResult.metadata
      );

      // Validate prompt quality
      const validation = this.enhancer.validatePromptQuality(enrichedPrompt);

      return {
        prompt: enrichedPrompt,
        metadata: {
          ...metadata,
          qualityValidation: validation,
          promptType: "meta_prompt",
          version: "2.0",
        },
        alternatives: this.generateAlternatives(
          framework,
          mergedOptions,
          analysis
        ),
      };
    } catch (error) {
      console.error("Advanced prompt building error:", error);
      return {
        prompt: `// Error: Could not generate a prompt.\n// ${error.message}`,
        metadata: {
          error: error.message,
          fallback: true,
          timestamp: new Date().toISOString(),
        },
        alternatives: [],
      };
    }
  }

  // NOTE: The following methods are placeholders and would need full implementation.

  extractAnalysis(options) {
    // In a real implementation, this would analyze user input, context, etc.
    return {
      domain: options.domain || "general",
      intent: options.intent || "information_retrieval",
      complexity: options.complexity || "medium",
      tone_preference: options.tone,
      // ... other analysis fields
    };
  }

  enrichPrompt(prompt, options, framework) {
    // Adds final layers of instructions like output format, persona, etc.
    let enriched = prompt;
    if (options.role) {
      enriched = `ROLE: You are a ${options.role}.\n\n` + enriched;
    }
    if (options.outputFormat) {
      enriched += `\n\n# OUTPUT FORMAT\nFormat the entire response as ${options.outputFormat}.`;
    }
    return enriched;
  }

  buildMetadata(prompt, framework, options, baseMetadata) {
    // Combines all metadata into a single comprehensive object
    return {
      ...baseMetadata,
      frameworkId: framework.id,
      frameworkName: framework.name,
      category: framework.category,
      optionsUsed: options,
      estimatedTokens: Math.ceil(prompt.length / 4),
      timestamp: new Date().toISOString(),
    };
  }

  generateAlternatives(framework, options, analysis) {
    // Generates alternative prompts with different reasoning modes or tones
    const alternatives = [];
    const altTones = ["technical", "creative", "analytical"].filter(
      (t) => t !== options.tone
    );

    for (const tone of altTones.slice(0, 2)) {
      const altOptions = { ...options, tone };
      // This is a simplified regeneration; a real system might be more sophisticated
      const altAnalysis = { ...analysis, tone_preference: tone };
      const altPrompt = this.enhancer.generateEnhancedPrompt(
        options.userInput || "",
        altAnalysis,
        framework,
        { useMetaPrompt: true }
      );
      alternatives.push({
        title: `Alternative (${tone} tone)`,
        prompt: altPrompt.prompt,
        metadata: { ...altPrompt.metadata, tone: tone },
      });
    }
    return alternatives;
  }
}

module.exports = new AdvancedPromptBuilder();
