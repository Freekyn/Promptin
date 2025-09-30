const http = require('http');

const testRequest = {
  userRequest: "I need to create a marketing strategy for our new product launch",
  preferences: {}
};

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze-intent',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  }
};

console.log('Testing API endpoint...\n');

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const result = JSON.parse(data);
      if (result.success) {
        console.log('✅ API is working!');
        console.log('\nAnalysis:');
        console.log('- Intent:', result.data.analysis.intent);
        console.log('- Domain:', result.data.analysis.domain);
        console.log('- Recommended Framework:', result.data.recommendedFramework?.name || 'None');
        console.log('- Confidence:', result.data.confidence?.frameworkMatch || 'N/A');
      } else {
        console.log('❌ API returned error:', result.error);
      }
    } catch (e) {
      console.log('❌ Failed to parse response:', e.message);
      console.log('Response:', data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error.message);
});

req.write(JSON.stringify(testRequest));
req.end();