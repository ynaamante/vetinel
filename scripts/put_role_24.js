const http = require('http');
const data = JSON.stringify({ name: 'Clinic Owner (edited)' });
const opts = {
  hostname: 'localhost',
  port: 3002,
  path: '/api/roles/24',
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    'Authorization': 'Bearer secret-token'
  }
};
const req = http.request(opts, res=>{
  let d='';
  res.on('data',c=>d+=c);
  res.on('end',()=>{
    console.log('URL: http://localhost:3002/api/roles/24');
    console.log('STATUS',res.statusCode);
    console.log('HEADERS',JSON.stringify(res.headers));
    console.log('BODY',d);
  });
});
req.on('error',e=>{ console.error('ERR',e.message); });
req.write(data);
req.end();
