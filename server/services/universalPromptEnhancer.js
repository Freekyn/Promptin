// services/universalPromptEnhancer.js - Meta-Prompt System Integration
const MetaPromptEnhancer = require("./metapromptenhancer");

class UniversalPromptEnhancer {
  constructor() {
    this.metaEnhancer = MetaPromptEnhancer;

    // Legacy support - keep for backward compatibility but prefer meta-prompts
    this.quickTemplates = {
      recommendation: this.buildRecommendationPrompt,
      technical: this.buildTechnicalPrompt,
      creative: this.buildCreativePrompt,
      analysis: this.buildAnalysisPrompt,
    };
  }

  // ========== PRIMARY METHOD - META-PROMPT GENERATION ==========

  generateEnhancedPrompt(
    userRequest,
    analysis,
    framework = null,
    options = {}
  ) {
    const {
      useMetaPrompt = true,
      forcedStrategy = null,
      includeExamples = false,
      customInstructions = null,
    } = options;

    // Use meta-prompting by default for superior quality
    if (useMetaPrompt) {
      const metaResult = this.metaEnhancer.enhanceFrameworkPrompt(
        framework,
        userRequest,
        analysis
      );

      // Add custom instructions if provided
      if (customInstructions) {
        metaResult.prompt += `\n\n# ADDITIONAL REQUIREMENTS\n${customInstructions}`;
      }

      // Add few-shot examples if requested
      if (includeExamples) {
        metaResult.prompt += this.generateRelevantExamples(analysis);
      }

      return metaResult;
    }

    // Fallback to quick templates for simple cases
    return this.generateQuickPrompt(userRequest, analysis, framework);
  }

  // ========== EXAMPLE GENERATION ==========

  generateRelevantExamples(analysis) {
    const exampleBank = {
      technical: `

# EXAMPLE: Technical Problem-Solving
Input: "How do I optimize database queries?"
Approach:
1. Analyze query patterns and identify bottlenecks
2. Consider indexing strategies (B-tree vs Hash)
3. Evaluate query execution plans
4. Implement and measure improvements

Apply similar systematic thinking to your task.`,

      business: `

# EXAMPLE: Strategic Analysis
Input: "How do we enter a new market?"
Approach:
1. Market sizing and segmentation analysis
2. Competitive landscape evaluation (Porter's Five Forces)
3. Go-to-market strategy development
4. Risk assessment and mitigation planning

Use this structured approach for your strategic problem.`,

      creative: `

# EXAMPLE: Creative Content Development
Input: "Create a compelling brand story"
Approach:
1. Identify core brand values and differentiators
2. Develop narrative arc with emotional resonance
3. Create multi-sensory scene descriptions
4. Ensure consistency across touchpoints

Apply this storytelling framework to your creative task.`,
    };

    const domain = analysis.domain || "general";
    return exampleBank[domain] || exampleBank.business;
  }

  // ========== QUICK TEMPLATE METHODS (Legacy Support) ==========

  generateQuickPrompt(userRequest, analysis, framework) {
    const promptType = this.determinePromptType(analysis);
    const builder = this.quickTemplates[promptType] || this.buildGenericPrompt;

    return {
      prompt: builder.call(this, userRequest, analysis, framework),
      metadata: {
        strategy: "quick_template",
        type: promptType,
        complexity: analysis.complexity,
        qualityLevel: "standard",
      },
    };
  }

  determinePromptType(analysis) {
    if (
      analysis.intent.includes("technical") ||
      analysis.intent.includes("code")
    ) {
      return "technical";
    }
    if (
      analysis.intent.includes("creative") ||
      analysis.intent.includes("content")
    ) {
      return "creative";
    }
    if (
      analysis.intent.includes("analysis") ||
      analysis.intent.includes("research")
    ) {
      return "analysis";
    }
    return "recommendation";
  }

  buildRecommendationPrompt(userRequest, analysis, framework) {
    return `You are an expert ${
      analysis.domain
    } specialist with deep industry knowledge.

USER REQUEST: ${userRequest}

TASK: Provide personalized, high-quality recommendations that:
- Are specific and actionable (not generic)
- Include clear reasoning for each recommendation
- Consider user context and preferences
- Anticipate potential questions or concerns
- Provide implementation guidance

${
  framework
    ? `FRAMEWORK: Apply ${framework.name} methodology\n${framework.base_prompt}\n`
    : ""
}

STRUCTURE YOUR RESPONSE:
1. Quick Overview (2-3 sentences)
2. Top Recommendations (3-5 specific items with detailed explanations)
3. Implementation Tips (practical next steps)
4. Common Pitfalls to Avoid

Deliver expert-level guidance with a ${
      analysis.tone_preference || "professional"
    } tone.`;
  }

  buildTechnicalPrompt(userRequest, analysis, framework) {
    return `You are a senior technical expert with extensive production experience.

TECHNICAL CHALLENGE: ${userRequest}

DELIVERABLES:
1. Problem Analysis
   - Core issue identification
   - Technical requirements
   - Constraints and trade-offs

2. Solution Architecture
   - Recommended approach with justification
   - Technology stack and tools
   - Architecture patterns to apply

3. Implementation Guide
   - Step-by-step development plan
   - Code examples or pseudocode
   - Testing and validation strategy

4. Production Considerations
   - Performance optimization
   - Security and scalability
   - Monitoring and maintenance

${
  framework
    ? `Apply ${framework.name} framework:\n${framework.base_prompt}\n`
    : ""
}

Provide production-ready technical guidance with clear explanations.`;
  }

  buildCreativePrompt(userRequest, analysis, framework) {
    return `You are an award-winning creative professional specializing in ${
      analysis.domain
    }.

CREATIVE BRIEF: ${userRequest}

CREATIVE PROCESS:

1. CONCEPT DEVELOPMENT
   - Core creative concept and hook
   - Emotional arc and storytelling elements
   - Unique angles and differentiation

2. DETAILED EXECUTION
   - Scene-by-scene or section-by-section breakdown
   - Sensory details and vivid descriptions
   - Visual, auditory, and emotional elements

3. REFINEMENT
   - Style and tone consistency
   - Pacing and rhythm
   - Impact and memorability factors

4. PRODUCTION GUIDANCE
   - Format-specific requirements
   - Technical specifications (if applicable)
   - Success metrics

${
  framework
    ? `Creative Framework: ${framework.name}\n${framework.base_prompt}\n`
    : ""
}

Deliver creative excellence with originality and emotional impact.`;
  }

  buildAnalysisPrompt(userRequest, analysis, framework) {
    return `You are a research analyst with expertise in ${
      analysis.domain
    } and systematic evaluation.

ANALYSIS REQUEST: ${userRequest}

ANALYTICAL FRAMEWORK:

1. SITUATIONAL ASSESSMENT
   - Current state analysis
   - Key factors and variables
   - Historical context and trends

2. DEEP DIVE INVESTIGATION
   - Data gathering and evaluation
   - Pattern identification
   - Root cause analysis

3. INSIGHTS & FINDINGS
   - Key discoveries and implications
   - Comparative analysis
   - Unexpected patterns or outliers

4. RECOMMENDATIONS
   - Actionable next steps
   - Priority ranking with rationale
   - Risk and opportunity assessment

${
  framework
    ? `Analysis Framework: ${framework.name}\n${framework.base_prompt}\n`
    : ""
}

Provide rigorous, evidence-based analysis with clear conclusions.`;
  }

  buildGenericPrompt(userRequest, analysis, framework) {
    return `You are an expert consultant with broad expertise.

REQUEST: ${userRequest}

APPROACH:
- Understand the request thoroughly
- Apply relevant expertise and frameworks
- Provide comprehensive, actionable guidance
- Ensure practical value and clarity

${framework ? `Framework: ${framework.name}\n${framework.base_prompt}\n` : ""}

Tone: ${analysis.tone_preference || "Professional"}
Complexity: ${analysis.complexity || "Medium"} level

Deliver high-quality, expert guidance.`;
  }

  // ========== UTILITY METHODS ==========

  addContextEnrichment(prompt, analysis) {
    const enrichments = [];

    if (analysis.urgency === "critical" || analysis.urgency === "high") {
      enrichments.push(
        "URGENCY: This is time-sensitive. Prioritize actionability and quick wins."
      );
    }

    if (analysis.constraints && analysis.constraints.length > 0) {
      enrichments.push(`CONSTRAINTS: ${analysis.constraints.join(", ")}`);
    }

    if (analysis.success_criteria && analysis.success_criteria.length > 0) {
      enrichments.push(
        `SUCCESS METRICS: ${analysis.success_criteria.join(", ")}`
      );
    }

    if (enrichments.length > 0) {
      return `${prompt}\n\n# CONTEXT\n${enrichments.join("\n")}`;
    }

    return prompt;
  }

  validatePromptQuality(prompt) {
    const checks = {
      hasStructure: prompt.includes("#") || prompt.includes("1."),
      hasContext: prompt.length > 200,
      hasInstructions:
        prompt.toLowerCase().includes("provide") ||
        prompt.toLowerCase().includes("create"),
      hasQualityGuidance:
        prompt.toLowerCase().includes("expert") ||
        prompt.toLowerCase().includes("professional"),
    };

    const score =
      Object.values(checks).filter(Boolean).length / Object.keys(checks).length;

    return {
      isValid: score >= 0.75,
      score: score,
      checks: checks,
      recommendations: this.getImprovementRecommendations(checks),
    };
  }

  getImprovementRecommendations(checks) {
    const recommendations = [];

    if (!checks.hasStructure) {
      recommendations.push("Add clear sections and numbered steps");
    }
    if (!checks.hasContext) {
      recommendations.push("Expand prompt with more context and detail");
    }
    if (!checks.hasInstructions) {
      recommendations.push("Include explicit instructions for the AI");
    }
    if (!checks.hasQualityGuidance) {
      recommendations.push("Add quality standards and expertise requirements");
    }

    return recommendations;
  }
}

module.exports = new UniversalPromptEnhancer();
