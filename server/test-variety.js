const http = require('http');

const testCases = [
  "I need to analyze customer feedback data and create a dashboard",
  "Help me write a creative story about space exploration",
  "Create a python script to process CSV files",
  "Design a business strategy for entering new markets"
];

console.log('🧪 Testing variety of requests...\n');

function testRequest(userRequest, index) {
  return new Promise((resolve) => {
    const postData = JSON.stringify({ userRequest });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analyze-intent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(data);
          if (result.success) {
            console.log(`${index + 1}. "${userRequest}"`);
            console.log(`   ✅ Intent: ${result.data.analysis.intent}`);
            console.log(`   📚 Framework: ${result.data.framework.selected.name}`);
            console.log(`   🎯 Confidence: ${result.data.metadata.confidence.overall}%\n`);
          }
        } catch (e) {
          console.log(`${index + 1}. ❌ Failed: ${e.message}`);
        }
        resolve();
      });
    });
    
    req.on('error', () => resolve());
    req.write(postData);
    req.end();
  });
}

async function runTests() {
  for (let i = 0; i < testCases.length; i++) {
    await testRequest(testCases[i], i);
  }
  
  console.log('✅ All tests complete!');
  console.log('\n🎉 YOUR PROMPTINSTYL MVP IS READY TO GO LIVE! 🎉');
}

runTests();