const { spawn } = require('node:child_process');
const { createWriteStream, mkdirSync } = require('node:fs');
const { createGzip } = require('node:zlib');
const { pipeline } = require('node:stream/promises');
const path = require('node:path');

async function main() {
  const output = path.resolve(__dirname, '../../output/aws-deployment');
  mkdirSync(output, { recursive: true });
  const child = spawn('docker', ['save', 'nextou-aws-frontend:local', 'nextou-aws-backend:local', 'nextou-aws-recommendation:local'], { stdio: ['ignore', 'pipe', 'inherit'] });
  const completed = new Promise((resolve, reject) => {
    child.on('error', reject);
    child.on('close', code => code === 0 ? resolve() : reject(new Error(`docker save exited ${code}`)));
  });
  await Promise.all([completed, pipeline(child.stdout, createGzip({ level: 1 }), createWriteStream(path.join(output, 'images.tar.gz')))]);
  console.log('Packaged the three tested application images.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
