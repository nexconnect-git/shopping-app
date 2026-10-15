const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const output = path.resolve(__dirname, '../../output/aws-deployment');
const resources = JSON.parse(fs.readFileSync(path.join(output, 'resources.json'), 'utf8'));
const credentials = JSON.parse(fs.readFileSync(path.join(output, 'credentials.json'), 'utf8'));
const report = [];
const request = (url, options = {}) => fetch(url, { ...options, signal: AbortSignal.timeout(20000) });

async function main() {
  const roleBundles = new Map();
  for (const [role, url] of Object.entries(resources.urls)) {
    const home = await request(url + '/');
    assert.equal(home.status, 200, `${role} homepage`);
    const html = await home.text();
    assert.ok(html.toLowerCase().includes('<!doctype html>'));
    assert.ok(!html.includes('Orbit Rush'));
    assert.ok(home.headers.get('strict-transport-security'));
    const script = html.match(/src="(main-[^"]+\.js)"/);
    assert.ok(script, `${role} main bundle`);
    roleBundles.set(role, script[1]);
    const bundle = await request(url + '/' + script[1]);
    assert.equal(bundle.status, 200);
    assert.ok(bundle.headers.get('content-type').includes('javascript'));
    const deepLink = await request(url + '/login');
    assert.equal(deepLink.status, 200);
    const ready = await request(url + '/health/ready/');
    assert.equal(ready.status, 200);
    const health = await ready.json();
    assert.equal(health.status, 'ready');
    for (const check of Object.values(health.checks)) assert.equal(check.ok, true);
    const emptyProducts = await request(url + '/sa/api/products/list/');
    assert.equal(emptyProducts.status, 200);
    assert.equal((await emptyProducts.json()).count, 0);
    const redirect = await request(url.replace('https://', 'http://') + '/', { redirect: 'manual' });
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get('location'), url + '/');
    report.push({ role, url, homepage: 'passed', bundle: 'passed', deepLink: 'passed', health: 'ready', products: 0, httpsRedirect: 'passed' });
  }
  assert.equal(new Set(roleBundles.values()).size, 4, 'each role serves its own Angular application');
  for (const url of resources.additionalPublicUrls || []) {
    const role = Object.entries(resources.temporaryUrls || {}).find(([, legacy]) => legacy === url)?.[0] || 'customer';
    const response = await request(url + '/');
    assert.equal(response.status, 200, `${url} alias homepage`);
    assert.ok((await response.text()).includes(roleBundles.get(role)), `${url} serves ${role}`);
    const readiness = await request(url + '/health/ready/');
    assert.equal(readiness.status, 200, `${url} backend host allowed`);
    const redirect = await request(url.replace('https://', 'http://') + '/', { redirect: 'manual' });
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get('location'), url + '/');
    report.push({ role, url, aliasRouting: 'passed', backendHost: 'passed', httpsRedirect: 'passed' });
  }
  const admin = resources.urls.admin;
  const unauthenticated = await request(admin + '/sa/api/admin/stats/');
  assert.ok([401, 403].includes(unauthenticated.status));
  const login = await request(admin + '/sa/api/auth/login/', {
    method: 'POST', headers: { 'Content-Type': 'application/json', Origin: admin },
    body: JSON.stringify({ username: credentials.admin.username, password: credentials.admin.password }),
  });
  assert.equal(login.status, 200, 'administrator login');
  assert.equal(login.headers.get('access-control-allow-origin'), admin, 'custom-domain CORS');
  const body = await login.json();
  assert.equal(body.user.role, 'admin');
  const cookie = login.headers.get('set-cookie');
  assert.ok(cookie.includes('Secure') && cookie.includes('HttpOnly'));
  const accessToken = body.tokens?.access || body.access;
  assert.ok(accessToken, 'access token present');
  const stats = await request(admin + '/sa/api/admin/stats/', { headers: { Authorization: `Bearer ${accessToken}` } });
  assert.equal(stats.status, 200, 'authenticated admin stats');
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(admin.replace('https://', 'wss://') + '/sa/ws/admin/stats/', ['nexconnect.jwt', accessToken]);
    const timer = setTimeout(() => { socket.close(); reject(new Error('Admin WebSocket handshake timed out')); }, 20000);
    socket.addEventListener('open', () => { clearTimeout(timer); socket.close(); resolve(); });
    socket.addEventListener('error', () => { clearTimeout(timer); reject(new Error('Admin WebSocket handshake failed')); });
  });
  const staticFile = await request(admin + '/django_static/admin/css/base.css');
  assert.equal(staticFile.status, 200);
  report.push({ administratorLogin: 'passed', accessControl: 'passed', secureRefreshCookie: 'passed', authenticatedStats: 'passed', webSocket: 'passed', djangoStatic: 'passed' });
  fs.writeFileSync(path.join(output, 'live-verification.json'), JSON.stringify({ checkedAt: new Date().toISOString(), account: resources.account, report }, null, 2));
  console.log('All four HTTPS apps and configured aliases passed public checks. Role routing, empty catalog, administrator login, CORS, authorization, secure cookies, WebSocket handshake, and static files verified.');
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
