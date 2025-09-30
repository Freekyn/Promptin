require('dotenv').config();

console.log('Environment Test:');
console.log('- .env file loaded');
console.log('- OpenAI API Key present:', !!process.env.OPENAI_API_KEY);
console.log('- Key starts with:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.substring(0, 7) + '...' : 'NOT FOUND');
console.log('- Key length:', process.env.OPENAI_API_KEY ? process.env.OPENAI_API_KEY.length : 0);