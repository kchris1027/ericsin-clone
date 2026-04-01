#!/usr/bin/env node
const http = require('http');
const fs = require('fs');
const path = require('path');
const { build } = require('./build');

const PORT = process.env.PORT || 3000;
const DIST = path.join(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.webp': 'image/webp',
};

const LIVE_RELOAD_SCRIPT = `
<script>
(function(){
  let es;
  function connect() {
    es = new EventSource('/__reload');
    es.onmessage = function(e) { if (e.data === 'reload') location.reload(); };
    es.onerror = function() { es.close(); setTimeout(connect, 1000); };
  }
  connect();
})();
</script>
</body>`;

let reloadClients = [];

function sendReload() {
  reloadClients.forEach(res => {
    res.write('data: reload\n\n');
  });
}

function initialBuild() {
  try {
    build();
    console.log('[dev] Build complete');
  } catch (err) {
    console.error('[dev] Build error:', err.message);
  }
}

initialBuild();

const server = http.createServer((req, res) => {
  if (req.url === '/__reload') {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    res.write(':ok\n\n');
    reloadClients.push(res);
    req.on('close', () => {
      reloadClients = reloadClients.filter(r => r !== res);
    });
    return;
  }

  let urlPath = req.url.split('?')[0];
  if (urlPath === '/') urlPath = '/index.html';

  const filePath = path.join(DIST, urlPath);
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, data) => {
    if (err) {
      if (err.code === 'ENOENT') {
        // SPA fallback
        fs.readFile(path.join(DIST, 'index.html'), (err2, data2) => {
          if (err2) {
            res.writeHead(404);
            res.end('Not found');
            return;
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          const injected = data2.toString().replace('</body>', LIVE_RELOAD_SCRIPT);
          res.end(injected);
        });
        return;
      }
      res.writeHead(500);
      res.end('Server error');
      return;
    }

    res.writeHead(200, { 'Content-Type': contentType });
    if (ext === '.html') {
      const injected = data.toString().replace('</body>', LIVE_RELOAD_SCRIPT);
      res.end(injected);
    } else {
      res.end(data);
    }
  });
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`[dev] Port ${PORT} is in use. Try: PORT=3001 npm run dev`);
    process.exit(1);
  }
  throw err;
});

server.listen(PORT, () => {
  console.log(`[dev] Server running at http://localhost:${PORT}`);
  console.log('[dev] Watching for file changes...');
});

// File watching with chokidar
let chokidar;
try {
  chokidar = require('chokidar');
} catch (e) {
  console.warn('[dev] chokidar not found, file watching disabled. Run: npm install chokidar');
}

if (chokidar) {
  let debounceTimer = null;
  const watchPaths = [
    path.join(__dirname, 'site.config.yml'),
    path.join(__dirname, 'content'),
    path.join(__dirname, 'templates'),
    path.join(__dirname, 'static'),
    path.join(__dirname, 'locales'),
  ];

  const watcher = chokidar.watch(watchPaths, {
    ignoreInitial: true,
    ignored: /node_modules|\.git|dist/,
  });

  watcher.on('all', (event, filePath) => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const rel = path.relative(__dirname, filePath);
      console.log(`[dev] ${event}: ${rel}`);
      try {
        build();
        console.log('[dev] Rebuild complete');
        sendReload();
      } catch (err) {
        console.error('[dev] Build error:', err.message);
      }
    }, 200);
  });
}
