const axios = require('axios');
const FormData = require('form-data');

async function testPost() {
  try {
    const form = new FormData();
    form.append('content', 'Testing from Node.js!');
    
    const res = await axios.post('http://localhost:5000/api/posts', form, {
      headers: form.getHeaders()
    });
    console.log("Success:", res.data);
  } catch (err) {
    console.error("Error:", err.response ? err.response.data : err.message);
  }
}

testPost();
