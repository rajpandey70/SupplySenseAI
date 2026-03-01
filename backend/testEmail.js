const axios = require('axios');

async function testEmail() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      username: 'admin@supplysense.ai',
      password: 'admin123'
    });
    
    const token = loginRes.data.data.token;
    
    const createRes = await axios.post('http://localhost:5000/api/auth/users', {
      username: 'test_node_email_' + Date.now(),
      email: 'test' + Date.now() + '@ethereal.email',
      password: 'tempPassword123',
      fullName: 'Test Email User',
      role: 'user'
    }, {
      headers: { Authorization: \`Bearer \${token}\` }
    });
    
    console.log("User created:", createRes.data.data.email);
  } catch (error) {
    console.error("Test failed:", error.response ? error.response.data : error.message);
  }
}

testEmail();
