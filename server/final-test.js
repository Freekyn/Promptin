const http = require('http');

console.log('🧪 Testing PromptInSTYL API...\n');

// Test 1: Health check
console.log('1️⃣ Testing /api/health endpoint...');
http.get('http://localhost:3000/api/health', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('✅ Health check response:', JSON.parse(data).data.status);
    
    // Test 2: Analyze intent
    console.log('\n2️⃣ Testing /api/analyze-intent endpoint...');
    
    const postData = JSON.stringify({
      userRequest: 'I need to create a marketing strategy for our new product'
    });
    
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/analyze-intent',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': postData.length
      },
      timeout: 30000 // 30 second timeout
    };
    
    const req = http.request(options, (res) => {
      console.log('Response Status:', res.statusCode);
      
      let responseData = '';
      res.on('data', chunk => responseData += chunk);
      res.on('end', () => {
        try {
          const result = JSON.parse(responseData);
          if (result.success) {
            console.log('✅ Intent analysis successful!');
            console.log('- Intent:', result.data.analysis.intent);
            console.log('- Domain:', result.data.analysis.domain);
            console.log('- Framework:', result.data.framework?.selected?.name || 'Dynamic');
            console.log('- Confidence:', result.data.metadata?.confidence?.overall || 'N/A');
            console.log('\n🎉 YOUR WORLD-CLASS INTENT ANALYZER IS WORKING PERFECTLY!');
          } else {
            console.log('❌ Error:', result.error);
          }
        } catch (e) {
          console.log('❌ Parse error:', e.message);
          console.log('Raw response:', responseData);
        }
      });
    });
    
    req.on('timeout', () => {
      console.log('❌ Request timed out after 30 seconds');
      req.abort();
    });
    
    req.on('error', (e) => {
      console.log('❌ Request error:', e.message);
    });
    
    req.write(postData);
    req.end();
  });
}).on('error', (e) => {
  console.log('❌ Health check failed:', e.message);
  console.log('Is the server running on port 3000?');
});