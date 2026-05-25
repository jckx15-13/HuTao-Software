const http = require('http');
http.get('http://127.0.0.1:3000/', (res) => {
  console.log(`STATUS: ${res.statusCode}`);
  console.log('HEADERS:', res.headers);
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log(`BODY LENGTH: ${data.length}`);
    console.log(data.substring(0, 500));
  });
}).on('error', (err) => {
  console.error('ERROR:', err.message);
});
