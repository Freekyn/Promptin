const intentAnalyzer = require('./services/intentAnalyzer');

async function test() {
  console.log('Testing Intent Analyzer...\n');
  
  try {
    const testRequest = "I need to analyze customer feedback data and create a dashboard";
    console.log('Test Request:', testRequest);
    console.log('\nAnalyzing...');
    
    const result = await intentAnalyzer.analyzeUserIntent(testRequest);
    console.log('\nAnalysis Result:');
    console.log('- Intent:', result.intent);
    console.log('- Domain:', result.domain);
    console.log('- Complexity:', result.complexity);
    console.log('- Confidence:', result.confidence_score || 'N/A');
    console.log('\nIntent Analyzer is working!');
    
  } catch (error) {
    console.error('Error:', error.message);
    console.log('\nIntent Analyzer needs configuration or has issues.');
  }
  
  process.exit(0);
}

test();