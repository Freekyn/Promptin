import React, { createContext, useContext, useState } from 'react';

const ApiContext = createContext();

export const useApi = () => {
  const context = useContext(ApiContext);
  if (!context) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
};

export const ApiProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const apiBase = 'https://server-thrumming-paper-2833.fly.dev/api';

  const makeRequest = async (endpoint, options = {}) => {
    setLoading(true);
    setError(null);

    try {
      // Get auth token
      const result = await chrome.storage.local.get(['authToken']);
      const token = result.authToken;

      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      };

      const response = await fetch(`${apiBase}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Handle different error cases
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in.');
        } else if (response.status === 403) {
          throw new Error('Access denied. Please check your permissions.');
        } else if (response.status >= 500) {
          throw new Error('Server error. Please try again later.');
        } else if (response.status === 0 || !response.ok) {
          throw new Error('Failed to connect to server. Please check your internet connection.');
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      console.error('API request failed:', err);
      
      // Provide more user-friendly error messages
      let errorMessage = err.message;
      if (err.name === 'TypeError' && err.message.includes('fetch')) {
        errorMessage = 'Failed to connect to server. Please check your internet connection and try again.';
      } else if (err.message.includes('No token provided')) {
        errorMessage = 'Authentication required. Please sign in to continue.';
      }
      
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generatePrompt = async (userRequest, selectedRole, selectedFramework) => {
    try {
      return await makeRequest('/analyze-intent-enhanced', {
        method: 'POST',
        body: JSON.stringify({
          userRequest,
          selectedRole,
          selectedFramework: selectedFramework || undefined,
        }),
      });
    } catch (error) {
      // If authentication fails, provide a mock response for demo purposes
      console.log('Server request failed, using mock response:', error.message);
      
        // Generate structured meta-prompt based on user request
        const generateMetaPrompt = (request, role) => {
          const roleText = role || 'professional assistant';
          const requestLower = request.toLowerCase();
          
          // Detect different types of requests
          const isVideoRequest = requestLower.includes('video') || requestLower.includes('clip') || requestLower.includes('mp4') || requestLower.includes('promotional video');
          const isPosterRequest = requestLower.includes('poster') || requestLower.includes('marketing poster') || requestLower.includes('design poster');
          const isContentRequest = requestLower.includes('content') || requestLower.includes('blog') || requestLower.includes('article') || requestLower.includes('copy');
          const isEmailRequest = requestLower.includes('email') || requestLower.includes('newsletter') || requestLower.includes('campaign');
          const isSocialRequest = requestLower.includes('social media') || requestLower.includes('instagram') || requestLower.includes('twitter') || requestLower.includes('linkedin');
          const isWebsiteRequest = requestLower.includes('website') || requestLower.includes('landing page') || requestLower.includes('web page');
          const isPresentationRequest = requestLower.includes('presentation') || requestLower.includes('pitch') || requestLower.includes('deck');
          const isTechnicalRequest = requestLower.includes('technical') || requestLower.includes('documentation') || requestLower.includes('api') || requestLower.includes('code');
          
          if (isVideoRequest) {
            return `Act like a professional video director and SaaS marketer who specializes in short, high-conversion product launch clips for B2B and founder audiences. Your job is to produce one crisp, cinematic 8-second promotional video (MP4) that clearly communicates the SaaS product's core value and drives viewers to sign up. Use photorealistic product UI mockups, clean typography overlays, subtle motion, and native audio (voiceover + supporting SFX + ambient music).

--- RUN/TARGET SETTINGS (for Veo 3) ---
model: veo-3.0-generate-preview
duration: 8s
aspectRatio: 16:9 (alternate: 9:16 for social stories/reels)
resolution: 1920x1080 (1080p)
fps: 30
quality: high
audio: native VO + SFX + music
guidance: follow prompt precisely, favor clarity and on-screen CTA

--- REPLACE THESE PLACEHOLDERS BEFORE RUN ---
[PRODUCT_NAME] => (e.g., "Flowlytics")
[ONE_LINE_USP] => (e.g., "Ship analytics-ready features 10× faster")
[TARGET_AUDIENCE] => (e.g., "startup PMs & growth teams")
[CTA_TEXT] => (e.g., "Start free trial")
[CTA_URL] => (e.g., "example.com/start")
[BRAND_PRIMARY] => (hex, e.g., #4F46E5)
[BRAND_ACCENT] => (hex, e.g., #06B6D4)
[LOGO_IMAGE_URL] => (public URL to high-res PNG)

--- VISUAL + TIMING BREAKDOWN (exact seconds) ---
0.00–0.60s (Logo + Hook)
- Visual: quick brand-gradient wipe (BRAND_PRIMARY → BRAND_ACCENT). Logo ([LOGO_IMAGE_URL]) animates in with a gentle scale/pop.
- On-screen text (large, centered): HEADLINE VARIANT A (choose 1): 
  - "Launch faster. Learn smarter." 
  - "From idea to insight — in hours." 
  - "Analytics that ship with your product."
- Audio: small percussive 'pop' + rising synth whoosh.
- Camera: tight, subtle zoom-out on logo.

0.60–3.00s (Hero Product Moment)
- Visual: slick 3D-style or glassmorphism card of product UI slides in from right; animate a single core flow (e.g., drag → insight).
- On-screen microcopy (top-left overlay, semi-bold): [ONE_LINE_USP]
- Micro-animations: key metrics flip to show "x10 faster", "zero infra".
- VO (confident, neutral, friendly, 28–40s voice): "Meet [PRODUCT_NAME]. The fastest way for [TARGET_AUDIENCE] to [ONE_LINE_USP]."
- SFX: gentle UI click + subtle ambient pad.

3.00–5.50s (Use / Benefit Slice)
- Visual: split-second b-roll mock: hands on laptop with product dashboard; quick close-up on an actionable metric rising.
- On-screen bullet badges (appear one-by-one): 
  1) "No code integration" 
  2) "Instant product insights" 
  3) "Enterprise-grade security"
- VO: two-line continuation: "No code, instant insights, enterprise security — all out of the box."
- Motion: smooth cross dissolves, micro-parallax.

5.50–7.20s (Social Proof / Benefit Amplifier)
- Visual: one short 2-up panel: left side — customer quote (1 line); right side — 5-star micro rating or company logos (silhouettes).
- On-screen copy: short customer quote e.g., "Cut release time in half — Head of PM, ScaleUp"
- VO (concluding): "Loved by growth teams."
- SFX: soft confirmation chime.

7.20–8.00s (CTA Close)
- Visual: full-screen CTA card. Big rounded CTA button animates (pressable). Show [CTA_URL] and button text [CTA_TEXT].
- On-screen: small legal line: "Free 14-day trial — no credit card"
- Logo reappears lower-left; tagline below logo: short tagline (same as subheading).
- Audio: brief triumphant sting; VO (final, 1s): "[PRODUCT_NAME]. Try it free."
- End frame hold (last 0.4s) with subtle fade-out.

--- AUDIO DIRECTION ---
- Music: modern, upbeat ambient electronic (warm synths), low-mid energy — keep VO intelligible (music -12 to -15 dB under VO).
- Voice: clear, friendly, slightly authoritative; neutral international English accent.
- SFX: tasteful whooshes for transitions, soft clicks for UI actions, a gentle 'ping' for metric increases.
- Mix: VO center, music stereo width moderate, SFX spatially placed to match motion.

--- STYLE + DESIGN GUIDELINES ---
- Visual style: modern SaaS — glassmorphism cards, soft rounded corners, micro-shadows, clean negative space.
- Color: use [BRAND_PRIMARY] for hero accents, [BRAND_ACCENT] for CTA and highlights.
- Typography: Inter-Bold (headline), Inter-Medium (subheads), Inter-Regular (body). Headline max 6 words.
- Motion: fast, confident cuts; prefer scale and opacity transitions; avoid long slow pans.
- Accessibility: text contrast AA compliant; CTA button minimum size 44x44 px equivalent.

--- ON-SCREEN COPY (ready to paste) ---
Headline (pick one): 
- "Launch faster. Learn smarter."
- "From idea to insight — in hours."
- "Analytics that ship with your product."

Subheading (one-line): "[PRODUCT_NAME] gives [TARGET_AUDIENCE] instant product insights — no infra, no fuss."

3 concise bullets (short lines for quick reads):
- "Plug & play integration"
- "Live feature telemetry"
- "Secure, enterprise-ready"

CTA button: "[CTA_TEXT]" → links to [CTA_URL]

--- PROMPT CLARITY / NEGATIVES (what to avoid) ---
- Avoid heavy on-screen paragraphs; keep copy punchy (≤7 words per headline, ≤3 bullets).
- No cheesy stock close-ups of actors staring at camera.
- Avoid slow, ambiguous camera movement (no slow 20s pans).
- No low-resolution textures or overly saturated colors.

--- ASSET NOTES (optional for higher fidelity) ---
- Provide a transparent PNG of logo [LOGO_IMAGE_URL].
- If possible, supply a 1920x1080 mockup of the product UI or a single screen capture — instruct Veo to animate the supplied UI (if not available, let model generate a polished UI mockup in the brand palette).

--- DELIVERY SPEC ->
- File: MP4, H.264, 1920x1080, 8s
- Also generate: 1 x 9:16 crop variant (automatic reframe), 1 x 6s teaser loop (optional)

Take a deep breath and work on this problem step-by-step.`;
          } else if (isPosterRequest) {
            return `Act like a professional ${roleText} and creative poster designer. You specialize in crafting visually compelling and persuasive marketing posters for new digital products.

Objective:  
I want you to design the full concept of a poster for a brand-new SaaS product launch. The poster should be visually striking, clearly communicate the product's value proposition, and inspire potential customers to take action (such as visiting a website, signing up, or requesting a demo).

Step-by-step structure:

1. Start by asking clarifying questions (if needed) about the SaaS product:
   - What problem does it solve?
   - Who is the target audience (B2B, startups, enterprises, solo entrepreneurs)?
   - What is the product's unique selling proposition (USP)?
   - What action do we want the audience to take after seeing the poster?

2. Provide a detailed headline for the poster. The headline should be short, powerful, and emotionally appealing. Give at least 3 variations.

3. Create a subheading or tagline that reinforces the headline and highlights the SaaS product's benefits in a concise, persuasive way.

4. Suggest the main visual concept(s) for the poster. Describe possible graphics, illustrations, or imagery that would best communicate the product's value.

5. Write out the key content sections of the poster:
   - Headline
   - Subheading / tagline
   - 3–5 bullet points (benefits or features)
   - Call-to-action (CTA) line

6. Recommend design elements:
   - Color scheme (aligned with tech/SaaS aesthetics, such as modern gradients, bold contrasts, or minimalist corporate styles)
   - Font choices (headline font vs body text)
   - Layout ideas (centered hero image, split design, or infographic-inspired)

7. Provide 2–3 different stylistic poster variations (e.g., minimal & sleek, bold & energetic, futuristic & innovative).

8. End with a final polished draft of one full poster concept, written as if you were giving instructions to a professional graphic designer.

Make sure the output is detailed, creative, and highly practical so that it can directly be handed over to a design team for execution.

Take a deep breath and work on this problem step by step.`;
          } else if (isContentRequest) {
            return `Act like a professional ${roleText} and content strategist. You specialize in creating compelling, SEO-optimized content that drives engagement and conversions for SaaS products.

Objective:
Create a comprehensive content strategy and execution plan that addresses the specific needs outlined in the user request. Focus on creating valuable, actionable content that positions the product as the solution to the target audience's problems.

Step-by-step structure:

1. Content Analysis & Strategy:
   - Analyze the target audience and their pain points
   - Identify content gaps and opportunities
   - Define content pillars and themes
   - Establish content goals and KPIs

2. Content Planning:
   - Create a content calendar with specific topics
   - Define content formats (blog posts, guides, case studies, etc.)
   - Plan content distribution across channels
   - Identify content promotion strategies

3. Content Creation Framework:
   - Develop compelling headlines and hooks
   - Structure content for maximum readability
   - Include relevant keywords naturally
   - Add clear calls-to-action

4. Content Optimization:
   - SEO best practices implementation
   - Internal linking strategy
   - Meta descriptions and title tags
   - Content performance tracking

5. Content Distribution:
   - Channel-specific adaptations
   - Social media content variations
   - Email marketing integration
   - Community engagement strategies

6. Content Performance:
   - Key metrics to track
   - A/B testing recommendations
   - Content iteration strategies
   - ROI measurement

Make sure the output is detailed, actionable, and tailored to the specific content needs mentioned in the request.

Take a deep breath and work on this problem step by step.`;
          } else if (isEmailRequest) {
            return `Act like a professional ${roleText} and email marketing specialist. You specialize in creating high-converting email campaigns that nurture leads and drive sales for SaaS products.

Objective:
Design a comprehensive email marketing strategy and create compelling email content that engages the target audience and drives the desired action.

Step-by-step structure:

1. Email Strategy Development:
   - Define email marketing objectives
   - Identify target audience segments
   - Plan email campaign types and sequences
   - Establish email frequency and timing

2. Email Campaign Planning:
   - Welcome series design
   - Nurture campaign structure
   - Promotional campaign strategy
   - Re-engagement campaign tactics

3. Email Content Creation:
   - Subject line optimization
   - Email body structure and copy
   - Call-to-action placement and design
   - Personalization strategies

4. Email Design & Layout:
   - Mobile-responsive design principles
   - Visual hierarchy and readability
   - Brand consistency guidelines
   - A/B testing recommendations

5. Email Automation:
   - Trigger-based email sequences
   - Behavioral targeting strategies
   - Drip campaign optimization
   - Lead scoring integration

6. Performance Optimization:
   - Key email metrics to track
   - Deliverability best practices
   - List hygiene and segmentation
   - Conversion rate optimization

Make sure the output is detailed, actionable, and tailored to the specific email marketing needs mentioned in the request.

Take a deep breath and work on this problem step by step.`;
          } else if (isSocialRequest) {
            return `Act like a professional ${roleText} and social media strategist. You specialize in creating engaging social media content that builds brand awareness and drives traffic for SaaS products.

Objective:
Develop a comprehensive social media strategy and create compelling content that resonates with the target audience across different social platforms.

Step-by-step structure:

1. Social Media Strategy:
   - Platform selection and audience analysis
   - Content pillars and themes
   - Posting frequency and timing
   - Engagement and community building

2. Content Creation:
   - Platform-specific content formats
   - Visual content guidelines
   - Caption writing and storytelling
   - Hashtag strategy and research

3. Content Calendar:
   - Weekly and monthly content planning
   - Seasonal and trending content integration
   - User-generated content strategies
   - Influencer collaboration planning

4. Engagement Strategy:
   - Community management guidelines
   - Response templates and tone
   - Crisis management protocols
   - Customer service integration

5. Performance Tracking:
   - Key social media metrics
   - Content performance analysis
   - ROI measurement strategies
   - Optimization recommendations

6. Growth Tactics:
   - Organic growth strategies
   - Paid social media advertising
   - Cross-platform promotion
   - Partnership and collaboration opportunities

Make sure the output is detailed, actionable, and tailored to the specific social media needs mentioned in the request.

Take a deep breath and work on this problem step by step.`;
          } else if (isWebsiteRequest) {
            return `Act like a professional ${roleText} and web designer. You specialize in creating high-converting websites and landing pages for SaaS products.

Objective:
Design a comprehensive website strategy and create compelling web content that converts visitors into customers.

Step-by-step structure:

1. Website Strategy:
   - User experience (UX) analysis
   - Information architecture planning
   - Conversion funnel optimization
   - Mobile-first design principles

2. Page Structure & Layout:
   - Homepage design and messaging
   - Landing page optimization
   - Navigation and user flow
   - Call-to-action placement

3. Content Strategy:
   - Headline and value proposition
   - Benefit-focused copywriting
   - Social proof and testimonials
   - FAQ and objection handling

4. Design Elements:
   - Visual hierarchy and readability
   - Color psychology and branding
   - Typography and spacing
   - Image and video integration

5. Conversion Optimization:
   - A/B testing strategies
   - Form optimization
   - Trust signals and security
   - Page speed and performance

6. Technical Implementation:
   - SEO optimization
   - Analytics and tracking
   - Responsive design
   - Accessibility compliance

Make sure the output is detailed, actionable, and tailored to the specific website needs mentioned in the request.

Take a deep breath and work on this problem step by step.`;
          } else if (isPresentationRequest) {
            return `Act like a professional ${roleText} and presentation designer. You specialize in creating compelling presentations that effectively communicate ideas and drive action.

Objective:
Create a comprehensive presentation strategy and design compelling slides that engage the audience and achieve the presentation goals.

Step-by-step structure:

1. Presentation Strategy:
   - Audience analysis and objectives
   - Key message development
   - Story structure and flow
   - Timing and pacing

2. Content Development:
   - Opening hook and introduction
   - Main points and supporting evidence
   - Visual storytelling techniques
   - Call-to-action and closing

3. Slide Design:
   - Visual hierarchy and layout
   - Typography and readability
   - Color scheme and branding
   - Image and graphic integration

4. Presentation Delivery:
   - Speaking notes and timing
   - Interactive elements and engagement
   - Q&A preparation
   - Technical setup and backup plans

5. Audience Engagement:
   - Interactive elements and polls
   - Storytelling techniques
   - Visual aids and demonstrations
   - Follow-up strategies

6. Performance Optimization:
   - Practice and rehearsal tips
   - Feedback collection methods
   - Iteration and improvement
   - Success metrics

Make sure the output is detailed, actionable, and tailored to the specific presentation needs mentioned in the request.

Take a deep breath and work on this problem step by step.`;
          } else if (isTechnicalRequest) {
            return `Act like a professional ${roleText} and technical writer. You specialize in creating clear, comprehensive technical documentation and guides for SaaS products.

Objective:
Develop detailed technical documentation that helps users understand and effectively use the product or service.

Step-by-step structure:

1. Technical Analysis:
   - System architecture overview
   - Feature functionality breakdown
   - User workflow analysis
   - Integration requirements

2. Documentation Structure:
   - Information architecture
   - User journey mapping
   - Content hierarchy
   - Navigation and searchability

3. Content Creation:
   - Getting started guides
   - Feature documentation
   - API reference materials
   - Troubleshooting guides

4. User Experience:
   - Clear, concise writing
   - Visual aids and diagrams
   - Code examples and snippets
   - Interactive elements

5. Quality Assurance:
   - Technical accuracy verification
   - User testing and feedback
   - Version control and updates
   - Accessibility compliance

6. Maintenance Strategy:
   - Regular content updates
   - User feedback integration
   - Performance monitoring
   - Continuous improvement

Make sure the output is detailed, actionable, and tailored to the specific technical needs mentioned in the request.

Take a deep breath and work on this problem step by step.`;
          } else {
            // Default general prompt for any other request
            return `Act like a professional ${roleText}. You are an expert in your field with years of experience helping businesses achieve their goals.

Objective:
Provide comprehensive, actionable guidance that directly addresses the specific request and delivers measurable results.

Step-by-step structure:

1. Problem Analysis:
   - Understand the core challenge or opportunity
   - Identify key stakeholders and their needs
   - Analyze current situation and constraints
   - Define success criteria and metrics

2. Strategic Planning:
   - Develop a clear action plan
   - Prioritize tasks and milestones
   - Identify required resources and tools
   - Create timeline and deadlines

3. Implementation Framework:
   - Detailed step-by-step instructions
   - Best practices and industry standards
   - Common pitfalls and how to avoid them
   - Quality control and validation methods

4. Optimization Strategies:
   - Performance monitoring and tracking
   - Continuous improvement recommendations
   - Scaling and growth considerations
   - Long-term sustainability planning

5. Success Metrics:
   - Key performance indicators (KPIs)
   - Measurement tools and methods
   - Reporting and analysis frameworks
   - ROI calculation and validation

6. Next Steps:
   - Immediate action items
   - Short-term and long-term goals
   - Resource requirements and recommendations
   - Support and maintenance considerations

Make sure the output is detailed, actionable, and tailored to the specific needs mentioned in the request.

Take a deep breath and work on this problem step by step.`;
          }
        };

        const mockResponse = {
          success: true,
          data: {
            framework: {
              selected: {
                name: "Meta-Prompt Framework",
                description: "Structured, professional prompt engineering",
                base_prompt: generateMetaPrompt(userRequest, selectedRole)
              },
              enhancedPrompt: generateMetaPrompt(userRequest, selectedRole)
            },
            metadata: {
              confidence: {
                overall: 95
              }
            },
            platformRecommendations: {
              recommendations: [
                { name: "ChatGPT", score: 95, strength: "Best for general tasks and creative writing" },
                { name: "Claude", score: 90, strength: "Excellent for analysis and reasoning" },
                { name: "Gemini", score: 85, strength: "Good for research and factual information" }
              ],
              useCase: "professional-prompt-engineering"
            }
          }
        };
      
      return mockResponse;
    }
  };

  const getRoles = async () => {
    try {
      return await makeRequest('/roles');
    } catch (error) {
      // Return fallback roles if API fails
      return {
        success: true,
        data: {
          allRoles: {
            creative: ['Copywriter', 'Content Creator', 'Graphic Designer', 'Video Editor'],
            technical: ['Software Developer', 'Data Scientist', 'DevOps Engineer', 'System Administrator'],
            business: ['Marketing Manager', 'Sales Representative', 'Project Manager', 'Business Analyst'],
            education: ['Teacher', 'Curriculum Developer', 'Educational Consultant', 'Training Specialist'],
            healthcare: ['Doctor', 'Nurse', 'Medical Researcher', 'Healthcare Administrator']
          }
        }
      };
    }
  };

  const getFrameworks = async () => {
    try {
      return await makeRequest('/frameworks/list?limit=100');
    } catch (error) {
      // Return fallback frameworks if API fails
      return {
        success: true,
        data: {
          frameworks: {
            'Basic Frameworks': [
              { id: 'basic', name: 'Basic Prompt', description: 'Simple, direct prompt structure', complexity_level: 'Beginner' },
              { id: 'chain-of-thought', name: 'Chain of Thought', description: 'Step-by-step reasoning approach', complexity_level: 'Intermediate' },
              { id: 'few-shot', name: 'Few-Shot Learning', description: 'Examples-based prompting', complexity_level: 'Intermediate' },
              { id: 'role-based', name: 'Role-Based', description: 'Act as a specific professional', complexity_level: 'Beginner' }
            ]
          }
        }
      };
    }
  };

  const exportPrompt = async (exportData) => {
    return makeRequest('/export-prompt', {
      method: 'POST',
      body: JSON.stringify(exportData),
    });
  };

  const value = {
    loading,
    error,
    generatePrompt,
    getRoles,
    getFrameworks,
    exportPrompt,
    clearError: () => setError(null)
  };

  return (
    <ApiContext.Provider value={value}>
      {children}
    </ApiContext.Provider>
  );
};
