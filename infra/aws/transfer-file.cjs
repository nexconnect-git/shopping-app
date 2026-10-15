const fs = require('node:fs');
const https = require('node:https');
const path = require('node:path');
const transferPath = process.argv[2];
const transfer = JSON.parse(fs.readFileSync(transferPath, 'utf8'));
const file = path.resolve(path.dirname(transferPath), transfer.file);
const request = https.request(transfer.url, { method: 'PUT', headers: { 'Content-Length': fs.statSync(file).size } }, response => {
  response.resume();
  response.on('end', () => {
    if (response.statusCode !== 200) { console.error(`Upload failed: HTTP ${response.statusCode}`); process.exitCode = 1; }
    else console.log(`Uploaded ${path.basename(file)} successfully.`);
  });
});
request.on('error', () => { console.error('Upload connection failed.'); process.exitCode = 1; });
fs.createReadStream(file).pipe(request);
