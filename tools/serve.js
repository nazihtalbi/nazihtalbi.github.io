// Local preview server for the portfolio (videos and YouTube films need a real web address, not a double-clicked file).
// Started by "Open website.bat". Only reachable from this computer.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..'), PORT = +(process.argv[2] || 5173);
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.mp4': 'video/mp4', '.json': 'application/json' };
process.on('uncaughtException', e => console.log('error:', e.message));
http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  const size = fs.statSync(f).size, type = T[path.extname(f).toLowerCase()] || 'application/octet-stream', range = req.headers.range;
  if (range) {
    const [s, e] = range.replace('bytes=', '').split('-'); const start = +s, end = e ? Math.min(+e, size - 1) : size - 1;
    if (!(start >= 0) || start >= size || end < start) { res.writeHead(416, { 'Content-Range': 'bytes */' + size }); return res.end(); }
    res.writeHead(206, { 'Content-Range': `bytes ${start}-${end}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': end - start + 1, 'Content-Type': type });
    return fs.createReadStream(f, { start, end }).pipe(res);
  }
  res.writeHead(200, { 'Content-Length': size, 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}).on('clientError', (e, sock) => sock.destroy())
  .on('error', e => { if (e.code === 'EADDRINUSE') console.log('The website is already running at http://localhost:' + PORT); else console.log(e.message); })
  .listen(PORT, '127.0.0.1', () => console.log('Website running at http://localhost:' + PORT + '  (close this window to stop it)'));
