'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.resolve(__dirname, 'public');

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
};

function sendFile(req, res, filePath, status = 200) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Fichier introuvable');
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(status, {
      'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
    });
    if (req.method === 'HEAD') res.end();
    else res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let pathname = '/';
  try {
    const parsed = new URL(req.url || '/', `http://localhost:${PORT}`);
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    pathname = '/';
  }

  const candidate = path.resolve(PUBLIC, '.' + (pathname.startsWith('/') ? pathname : '/' + pathname));
  if (!candidate.startsWith(PUBLIC + path.sep) && candidate !== PUBLIC) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Accès refusé');
    return;
  }

  const target = candidate === PUBLIC ? path.join(PUBLIC, 'index.html') : candidate;

  // SPA fallback : toute URL qui ne correspond pas à un fichier existant
  // renvoie index.html (le routeur client #/ prend le relais).
  fs.stat(target, (err, stats) => {
    if (!err && stats.isFile()) {
      sendFile(req, res, target, 200);
    } else {
      sendFile(req, res, path.join(PUBLIC, 'index.html'), 200);
    }
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Bwaka Marketplace (statique) démarré sur http://0.0.0.0:${PORT}`);
});
