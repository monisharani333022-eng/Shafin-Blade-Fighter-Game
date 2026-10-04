const http = require('http');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

const PORT = 8080;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.webp': 'image/webp',
  '.zip':  'application/zip',
  '.webmanifest': 'application/manifest+json'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath === '/' || urlPath === '') urlPath = '/index.html';
  if (urlPath === '/download' || urlPath === '/download-game') {
    urlPath = '/shafin_blade_fighter_offline.zip';
  }

  const filePath = path.join(ROOT, urlPath);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    if (err || !stat || !stat.isFile()) {
      const indexPath = path.join(ROOT, 'index.html');
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + urlPath);
      }
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME[ext] || 'application/octet-stream';
    const headers = {
      'Content-Type': contentType,
      'Cache-Control': 'no-cache',
      'Access-Control-Allow-Origin': '*'
    };
    if (urlPath.endsWith('sw.js')) {
      headers['Service-Worker-Allowed'] = '/';
      headers['Cache-Control'] = 'no-store';
    }
    if (ext === '.zip') {
      headers['Content-Disposition'] = 'attachment; filename="shafin_blade_fighter.zip"';
      headers['Content-Length'] = String(stat.size);
    }
    res.writeHead(200, headers);
    fs.createReadStream(filePath).pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  const ifaces = os.networkInterfaces();
  const ips = [];
  for (const n of Object.keys(ifaces)) {
    for (const i of ifaces[n]) {
      if (i.family === 'IPv4' && !i.internal) ips.push(i.address);
    }
  }

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║   SHAFIN BLADE FIGHTER 3D - GAME SERVER READY    ║');
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  Desktop:  http://localhost:' + PORT + '                 ║');
  ips.forEach(ip => console.log('║  Android:  http://' + ip + ':' + PORT + '      ║'));
  console.log('╠══════════════════════════════════════════════════╣');
  console.log('║  On Android Chrome: open the link above          ║');
  console.log('║  Then tap INSTALL at the bottom to install app   ║');
  console.log('╚══════════════════════════════════════════════════╝');
});