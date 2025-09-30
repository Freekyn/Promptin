// import_frameworks.js - Smart Framework Importer
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

async function importFrameworks() {
  const db = await open({
    filename: path.join(__dirname, 'data/frameworks.db'),
    driver: sqlite3.Database
  });

  // Clear existing frameworks first
  await db.run('DELETE FROM frameworks');
  console.log('Cleared existing frameworks');

  const frameworks = [
    {
      name: "Chain-of-Thought",
      category: "Reasoning", 
      description: "Guides the model to reveal its step‑by‑step reasoning before giving a final answer.",
      base_prompt: "Think step by step. Show your reasoning process clearly before giving your final answer. Break down the problem into logical steps and explain each step.",
      tone_modifiers: JSON.stringify(["Analytical", "Logical", "Neutral"]),
      role_variations: JSON.stringify(["Data Scientist", "AI Engineer", "Researcher", "Product Manager"]),
      output_formats: JSON.stringify(["Txt", "Pdf", "Research Paper", "Notebook"]),
      platforms: JSON.stringify(["ChatGPT", "Gemini", "Claude", "Perplexity", "Qwen", "DeepSeek", "Groq"]),
      models: JSON.stringify(["GPT‑4o", "o3", "Gemini‑1.5 Pro", "Claude‑3 Opus"]),
      token_estimate: 150
    },
    {
      name: "Step-by-Step",
      category: "Reasoning",
      description: "Explicitly instructs the model to answer incrementally, ensuring clear logic.",
      base_prompt: "Answer this incrementally, step by step. Ensure each step follows logically from the previous one. Number your steps and be explicit about your reasoning.",
      tone_modifiers: JSON.stringify(["Analytical", "Logical", "Neutral"]),
      role_variations: JSON.stringify(["Data Scientist", "AI Engineer", "Researcher", "Product Manager"]),
      output_formats: JSON.stringify(["Txt", "Pdf", "Research Paper", "Notebook"]),
      platforms: JSON.stringify(["ChatGPT", "Gemini", "Claude", "Perplexity", "Qwen", "DeepSeek", "Groq"]),
      models: JSON.stringify(["GPT‑4o", "o3", "Gemini‑1.5 Pro", "Claude‑3 Opus"]),
      token_estimate: 140
    },
    {
      name: "ReAct", 
      category: "Reasoning",
      description: "Combines reasoning and acting: the model thinks, uses tools, then thinks again.",
      base_prompt: "Use the ReAct framework: Think about the problem, Act by using available tools or gathering information, then Think again about the results. Repeat this cycle as needed.",
      tone_modifiers: JSON.stringify(["Analytical", "Logical", "Neutral"]),
      role_variations: JSON.stringify(["Data Scientist", "AI Engineer", "Researcher", "Product Manager"]),
      output_formats: JSON.stringify(["Txt", "Pdf", "Research Paper", "Notebook"]),
      platforms: JSON.stringify(["ChatGPT", "Gemini", "Claude", "Perplexity", "Qwen", "DeepSeek", "Groq"]),
      models: JSON.stringify(["GPT‑4o", "o3", "Gemini‑1.5 Pro", "Claude‑3 Opus"]),
      token_estimate: 180
    },
    {
      name: "Tree-of-Thought",
      category: "Reasoning", 
      description: "Explores multiple reasoning branches in parallel before selecting the best path.",
      base_prompt: "Explore multiple reasoning paths in parallel. Generate several different approaches to this problem, evaluate each branch, and then select the most promising path to pursue.",
      tone_modifiers: JSON.stringify(["Analytical", "Logical", "Neutral"]),
      role_variations: JSON.stringify(["Data Scientist", "AI Engineer", "Researcher", "Product Manager"]),
      output_formats: JSON.stringify(["Txt", "Pdf", "Research Paper", "Notebook"]),
      platforms: JSON.stringify(["ChatGPT", "Gemini", "Claude", "Perplexity", "Qwen", "DeepSeek", "Groq"]),
      models: JSON.stringify(["GPT‑4o", "o3", "Gemini‑1.5 Pro", "Claude‑3 Opus"]),
      token_estimate: 200
    },
    {
      name: "Self-Consistency",
      category: "Reasoning",
      description: "Generates multiple reasoning paths and picks the consensus answer for robustness.", 
      base_prompt: "Generate multiple independent reasoning paths for this problem. Compare the different approaches and identify the consensus answer that appears most frequently or consistently across different reasoning methods.",
      tone_modifiers: JSON.stringify(["Analytical", "Logical", "Neutral"]),
      role_variations: JSON.stringify(["Data Scientist", "AI Engineer", "Researcher", "Product Manager"]),
      output_formats: JSON.stringify(["Txt", "Pdf", "Research Paper", "Notebook"]),
      platforms: JSON.stringify(["ChatGPT", "Gemini", "Claude", "Perplexity", "Qwen", "DeepSeek", "Groq"]),
      models: JSON.stringify(["GPT‑4o", "o3", "Gemini‑1.5 Pro", "Claude‑3 Opus"]),
      token_estimate: 190
    }
  ];

  // Add platforms and models columns to the table first
  try {
    await db.exec(`
      ALTER TABLE frameworks ADD COLUMN platforms TEXT DEFAULT '[]';
      ALTER TABLE frameworks ADD COLUMN models TEXT DEFAULT '[]';
    `);
  } catch (e) {
    // Columns might already exist
  }

  let inserted = 0;
  for (const framework of frameworks) {
    try {
      await db.run(`
        INSERT INTO frameworks (name, category, description, base_prompt, tone_modifiers, role_variations, output_formats, platforms, models, token_estimate, tags)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        framework.name,
        framework.category, 
        framework.description,
        framework.base_prompt,
        framework.tone_modifiers,
        framework.role_variations,
        framework.output_formats,
        framework.platforms,
        framework.models,
        framework.token_estimate,
        JSON.stringify([framework.category.toLowerCase(), "reasoning", "advanced"])
      ]);
      inserted++;
      console.log(`✅ Imported: ${framework.name}`);
    } catch (error) {
      console.error(`❌ Failed to import ${framework.name}:`, error.message);
    }
  }

  await db.close();
  console.log(`🎉 Successfully imported ${inserted} frameworks!`);
}

if (require.main === module) {
  importFrameworks().catch(console.error);
}

module.exports = { importFrameworks };