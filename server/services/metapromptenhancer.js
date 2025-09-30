// services/metaPromptEnhancer.js - Advanced Meta-Prompt Engineering System

class MetaPromptEnhancer {
  constructor() {
    this.reasoningStrategies = {
      chain_of_thought: this.chainOfThoughtTemplate,
      tree_of_thought: this.treeOfThoughtTemplate,
      react: this.reactTemplate,
      self_critique: this.selfCritiqueTemplate,
      expert_panel: this.expertPanelTemplate,
      socratic: this.socraticTemplate,
    };

    this.domainExpertise = {
      technical: {
        credentials:
          "Senior Staff Engineer with 15+ years at FAANG companies, specializing in distributed systems, cloud architecture, and performance optimization",
        methodology: "Systems thinking, design patterns, scalability analysis",
        validation:
          "Code review standards, performance benchmarks, security audits",
      },
      business: {
        credentials:
          "MBA from top-tier institution, former McKinsey consultant, 20+ years in strategy and operations",
        methodology:
          "Porter's Five Forces, SWOT analysis, OKR frameworks, Business Model Canvas",
        validation: "Financial modeling, market analysis, risk assessment",
      },
      creative: {
        credentials:
          "Award-winning creative director with portfolio spanning advertising, film, and digital media",
        methodology:
          "Design thinking, storytelling frameworks, user journey mapping",
        validation: "A/B testing, user feedback, engagement metrics",
      },
      data_science: {
        credentials:
          "PhD in Statistics, former lead data scientist at major tech company, published researcher",
        methodology:
          "Statistical inference, machine learning pipelines, experimental design",
        validation:
          "Cross-validation, significance testing, model evaluation metrics",
      },
      marketing: {
        credentials:
          "CMO with track record of 10x growth, expertise in growth hacking and brand strategy",
        methodology:
          "AARRR funnel, customer segmentation, attribution modeling",
        validation:
          "Conversion metrics, ROI analysis, brand sentiment tracking",
      },
      research: {
        credentials:
          "Published academic researcher with expertise in systematic literature review and meta-analysis",
        methodology:
          "Scientific method, systematic review protocols, evidence synthesis",
        validation:
          "Peer review standards, citation analysis, reproducibility checks",
      },
    };
  }

  // ========== CORE META-PROMPT GENERATION ==========

  generateMetaPrompt(userRequest, analysis, framework = null) {
    // Select optimal reasoning strategy based on request type
    const strategy = this.selectReasoningStrategy(analysis);

    // Get domain expertise
    const domain = analysis.domain || "general";
    const expertise =
      this.domainExpertise[domain] || this.domainExpertise.business;

    // Build the meta-prompt using selected strategy
    const metaPrompt = this.reasoningStrategies[strategy].call(
      this,
      userRequest,
      analysis,
      expertise,
      framework
    );

    return {
      prompt: metaPrompt,
      metadata: {
        strategy: strategy,
        domain: domain,
        complexity: analysis.complexity,
        expertiseLevel: "advanced",
        techniques: this.getAppliedTechniques(strategy),
        estimatedQuality: "production-grade",
      },
    };
  }

  // ========== REASONING STRATEGY TEMPLATES ==========

  chainOfThoughtTemplate(userRequest, analysis, expertise, framework) {
    return `# EXPERT IDENTITY & CREDENTIALS
You are ${expertise.credentials}.

# TASK ASSIGNMENT
${userRequest}

# REASONING METHODOLOGY
Use a structured Chain-of-Thought approach with explicit reasoning at each step:

## Step 1: Deep Understanding
- Analyze the core problem/request in detail
- Identify explicit and implicit requirements
- Consider constraints, context, and success criteria
- List any assumptions that need validation

## Step 2: Knowledge Activation
- Recall relevant frameworks, principles, and best practices from ${
      analysis.domain
    }
- Consider analogous problems and their solutions
- Identify potential approaches and methodologies
${framework ? `- Apply the ${framework.name} framework specifically` : ""}

## Step 3: Solution Development
- Develop your approach step-by-step
- For each step, explicitly state:
  * What you're doing
  * Why you're doing it this way
  * What alternatives you considered
  * What trade-offs you're making

## Step 4: Validation & Refinement
Apply these validation criteria:
${this.getValidationCriteria(expertise, analysis)}

## Step 5: Final Synthesis
- Integrate all reasoning into a coherent solution
- Ensure completeness and actionability
- Highlight key insights and critical success factors

# OUTPUT REQUIREMENTS
- Show your reasoning process explicitly
- Use clear section headers and formatting
- Provide specific, actionable recommendations
- Include relevant examples or code where appropriate
- Address edge cases and potential challenges

# QUALITY STANDARDS
${this.getQualityStandards(analysis)}

Begin your analysis with "Let me approach this systematically..." and work through each step with visible reasoning.`;
  }

  treeOfThoughtTemplate(userRequest, analysis, expertise, framework) {
    return `# EXPERT IDENTITY
You are ${expertise.credentials}.

# COMPLEX PROBLEM-SOLVING TASK
${userRequest}

# METHODOLOGY: Tree of Thoughts
Explore multiple solution paths in parallel, evaluate them, and converge on the optimal approach.

## Phase 1: Problem Decomposition
Break down the request into 3-5 distinct sub-problems or aspects. For each:
- State the sub-problem clearly
- Identify key decision points
- List critical success factors

## Phase 2: Branch Exploration
For each sub-problem, generate 2-3 distinct solution approaches:

### Approach A: [Descriptive Name]
- Core strategy: [Description]
- Pros: [List advantages]
- Cons: [List limitations]
- Best suited for: [Context]

### Approach B: [Descriptive Name]
- Core strategy: [Description]
- Pros: [List advantages]
- Cons: [List limitations]
- Best suited for: [Context]

[Repeat for Approach C if applicable]

## Phase 3: Evaluation Matrix
Evaluate each approach across key dimensions:
- Technical feasibility: [Score 1-10]
- Resource efficiency: [Score 1-10]
- Risk level: [Score 1-10]
- Long-term sustainability: [Score 1-10]
- Alignment with requirements: [Score 1-10]

## Phase 4: Synthesis
Select and integrate the strongest elements from different branches:
- Chosen primary approach: [Name and justification]
- Integrated elements from alternatives: [List]
- Hybrid optimizations: [Describe]

## Phase 5: Implementation Roadmap
Provide a detailed, step-by-step implementation plan using the synthesized approach.

# OUTPUT REQUIREMENTS
Structure your response to show the complete decision tree and reasoning process. Make the exploration of alternatives explicit and educational.

${this.getQualityStandards(analysis)}`;
  }

  reactTemplate(userRequest, analysis, expertise, framework) {
    return `# EXPERT AGENT SETUP
You are ${expertise.credentials}, operating in ReAct (Reasoning + Acting) mode.

# TASK
${userRequest}

# ReAct PROTOCOL
Alternate between Thought, Action, and Observation cycles until the task is complete.

## Cycle 1
**Thought**: [Analyze the initial situation, what needs to be understood first]
**Action**: [Decide what to do - gather info, analyze, create plan, etc.]
**Observation**: [What you learned/discovered from this action]

## Cycle 2
**Thought**: [Based on previous observation, what's the next logical step]
**Action**: [Execute next action]
**Observation**: [Results and insights gained]

## Cycle 3
**Thought**: [Integrate learnings, identify gaps or issues]
**Action**: [Address gaps or refine approach]
**Observation**: [Updated understanding]

[Continue for 4-6 cycles until completion]

## Final Synthesis
**Thought**: [Final analysis and integration of all observations]
**Action**: [Produce final deliverable]
**Result**: [Complete solution with full reasoning trail]

# REASONING GUIDELINES
- Each Thought should explicitly reference prior Observations
- Actions should be concrete and specific
- Observations should note both expected and unexpected outcomes
- If an approach isn't working, explicitly pivot in your Thought process

# DOMAIN EXPERTISE APPLICATION
Apply ${expertise.methodology} throughout your reasoning.

${this.getQualityStandards(analysis)}

Begin with Cycle 1 Thought, and work through systematically.`;
  }

  selfCritiqueTemplate(userRequest, analysis, expertise, framework) {
    return `# EXPERT IDENTITY & ROLE
You are ${expertise.credentials}.

You will solve this problem using a self-critique methodology that ensures maximum quality.

# TASK
${userRequest}

# THREE-PASS METHODOLOGY

## PASS 1: Initial Solution Development
Create a comprehensive initial solution:
- Apply your expertise and best practices
- Develop a complete, detailed response
- Document your approach and reasoning
${framework ? `- Utilize the ${framework.name} framework` : ""}

## PASS 2: Critical Self-Review
Now, put on your critic's hat and review your Pass 1 solution:

### Strength Analysis
- What aspects are particularly strong?
- What novel insights or approaches did you apply?
- What would industry leaders praise about this solution?

### Vulnerability Analysis
- Where are the weak points or gaps?
- What assumptions might be problematic?
- What edge cases or failure modes exist?
- What might a domain expert criticize?

### Validation Checks
${this.getValidationCriteria(expertise, analysis)}

## PASS 3: Refined Final Solution
Based on your self-critique, produce an improved solution:
- Address identified weaknesses
- Strengthen vulnerable areas
- Add missing components
- Optimize based on validation results
- Document what you changed and why

# OUTPUT STRUCTURE
Present all three passes clearly:
1. Initial Solution (with visible reasoning)
2. Critical Analysis (honest and thorough)
3. Final Refined Solution (production-ready)

This demonstrates intellectual humility and commitment to excellence.

${this.getQualityStandards(analysis)}`;
  }

  expertPanelTemplate(userRequest, analysis, expertise, framework) {
    return `# EXPERT PANEL SIMULATION
Simulate a panel of diverse experts collaborating on this task.

# TASK
${userRequest}

# PANEL COMPOSITION
You will embody different expert perspectives sequentially:

## Expert 1: Domain Specialist
**Identity**: ${expertise.credentials}
**Perspective**: [Provide domain-specific analysis and recommendations]
**Key Concerns**: [List 3-5 critical factors from this perspective]

## Expert 2: Practical Implementer
**Identity**: Senior practitioner with 20+ years hands-on experience
**Perspective**: [Focus on practical feasibility, resource constraints, real-world challenges]
**Key Concerns**: [What could go wrong? What's often overlooked?]

## Expert 3: Strategic Advisor
**Identity**: C-suite executive or senior consultant
**Perspective**: [Business impact, ROI, alignment with objectives]
**Key Concerns**: [Strategic fit, competitive advantage, long-term implications]

## Expert 4: Quality Auditor
**Identity**: Standards and best practices specialist
**Perspective**: [Quality assurance, risk management, compliance]
**Key Concerns**: [What standards must be met? What risks exist?]

# PANEL DISCUSSION
Facilitate a discussion where experts:
1. Share their individual perspectives
2. Challenge each other constructively
3. Identify points of agreement and disagreement
4. Debate trade-offs and priorities

# CONSENSUS BUILDING
Synthesize expert inputs into:
- Core agreed-upon recommendations
- Acknowledged trade-offs and their implications
- Risk mitigation strategies
- Phased implementation approach that satisfies multiple perspectives

# FINAL DELIVERABLE
Present an integrated solution that reflects multi-perspective wisdom.

${this.getQualityStandards(analysis)}`;
  }

  socraticTemplate(userRequest, analysis, expertise, framework) {
    return `# SOCRATIC REASONING SYSTEM
You are ${
      expertise.credentials
    }, using Socratic methodology to arrive at deep understanding.

# INITIAL REQUEST
${userRequest}

# SOCRATIC PROCESS

## Question 1: Clarification
"What exactly is being asked here?"
[Analyze the request deeply, break down ambiguities]

Answer: [Your analysis]

## Question 2: Assumptions
"What assumptions underlie this request?"
[Identify and challenge assumptions]

Answer: [List and examine assumptions]

## Question 3: Evidence & Reasoning
"What evidence or reasoning supports different approaches?"
[Explore various solutions and their foundations]

Answer: [Evidence-based analysis]

## Question 4: Alternative Perspectives
"How might others view this differently?"
[Consider diverse viewpoints]

Answer: [Multi-perspective analysis]

## Question 5: Implications
"What are the implications and consequences?"
[Think through second and third-order effects]

Answer: [Consequence analysis]

## Question 6: Synthesis
"What is the most robust solution given this examination?"
[Integrate insights into a coherent answer]

Answer: [Final synthesized solution]

# METHODOLOGY NOTES
- Each answer should be thorough and demonstrate deep thinking
- Challenge your own reasoning
- Be willing to revise earlier conclusions based on later insights
- Show intellectual growth through the questioning process

${this.getQualityStandards(analysis)}`;
  }

  // ========== HELPER METHODS ==========

  selectReasoningStrategy(analysis) {
    const { intent, complexity, reasoning_type } = analysis;

    // Direct mapping if specified
    if (reasoning_type && this.reasoningStrategies[reasoning_type]) {
      return reasoning_type;
    }

    // Intelligent selection based on task characteristics
    if (complexity === "expert" || complexity === "complex") {
      return "tree_of_thought";
    }

    if (intent === "research" || intent === "analysis") {
      return "socratic";
    }

    if (intent === "technical" || intent === "problem_solving") {
      return "react";
    }

    if (intent === "business_strategy" || intent === "decision_making") {
      return "expert_panel";
    }

    if (intent === "creative_writing" || intent === "content_creation") {
      return "chain_of_thought";
    }

    // Default to self-critique for quality assurance
    return "self_critique";
  }

  getValidationCriteria(expertise, analysis) {
    const criteria = [
      "- Accuracy: Are all facts and claims verifiable?",
      "- Completeness: Have all aspects been addressed?",
      "- Practicality: Is this implementable with available resources?",
      "- Scalability: Will this work at different scales?",
      `- Domain Standards: Does this meet ${analysis.domain} best practices?`,
    ];

    if (expertise.validation) {
      criteria.push(`- ${expertise.validation}`);
    }

    return criteria.join("\n");
  }

  getQualityStandards(analysis) {
    const standards = [
      "# QUALITY STANDARDS",
      "- Provide specific, actionable guidance (not generic advice)",
      "- Include relevant examples, data, or code where applicable",
      "- Address potential failure modes and edge cases",
      "- Cite best practices and proven methodologies",
      `- Meet ${analysis.complexity || "professional"}-level expectations`,
      "- Ensure recommendations are implementable and measurable",
    ];

    return standards.join("\n");
  }

  getAppliedTechniques(strategy) {
    const techniques = {
      chain_of_thought: [
        "Explicit reasoning",
        "Step-by-step analysis",
        "Assumption validation",
      ],
      tree_of_thought: [
        "Multi-path exploration",
        "Comparative evaluation",
        "Solution synthesis",
      ],
      react: [
        "Iterative reasoning",
        "Action-observation cycles",
        "Adaptive problem-solving",
      ],
      self_critique: [
        "Self-review",
        "Weakness identification",
        "Iterative refinement",
      ],
      expert_panel: [
        "Multi-perspective analysis",
        "Collaborative reasoning",
        "Consensus building",
      ],
      socratic: [
        "Question-driven inquiry",
        "Assumption challenging",
        "Deep understanding",
      ],
    };

    return techniques[strategy] || ["Advanced reasoning"];
  }

  // ========== INTEGRATION METHOD ==========

  enhanceFrameworkPrompt(framework, userRequest, analysis) {
    // If framework exists, integrate it with meta-prompting
    if (framework && framework.base_prompt) {
      const metaPrompt = this.generateMetaPrompt(
        userRequest,
        analysis,
        framework
      );

      return {
        ...metaPrompt,
        prompt: `${metaPrompt.prompt}\n\n# FRAMEWORK INTEGRATION\n${framework.base_prompt}\n\nIntegrate this framework guidance into your reasoning process.`,
        metadata: {
          ...metaPrompt.metadata,
          framework: framework.name,
          frameworkIntegrated: true,
        },
      };
    }

    // Pure meta-prompt without framework
    return this.generateMetaPrompt(userRequest, analysis);
  }
}

module.exports = new MetaPromptEnhancer();
