const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.env.FRONTEND_PORT || process.env.PORT) || 5173;
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const defaultApiBase = process.env.API_BASE || '/api/v1';

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
};

http
  .createServer((req, res) => {
    const requestUrl = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const safePath = path
      .normalize(requestUrl.pathname === '/' ? '/index.html' : requestUrl.pathname)
      .replace(/^\.\.(\/|\\|$)/, '');
    const filePath = path.resolve(root, `.${safePath}`);
    const rootPath = path.resolve(root);

    if (!filePath.startsWith(`${rootPath}${path.sep}`) && filePath !== rootPath) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, file) => {
      if (err) {
        fs.readFile(path.join(root, 'index.html'), (indexErr, fallback) => {
          if (indexErr) {
            res.writeHead(404);
            res.end('Not Found');
            return;
          }
          const html = injectConfig(fallback.toString(), defaultApiBase, supabaseUrl, supabaseAnonKey);
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(html);
        });
        return;
      }

      const ext = path.extname(filePath);
      if (ext === '.html') {
        const html = injectConfig(file.toString(), defaultApiBase, supabaseUrl, supabaseAnonKey);
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(html);
        return;
      }

      res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'text/plain; charset=utf-8' });
      res.end(file);
    });
  })
  .listen(port, () => {
    console.log(`Frontend listening at http://localhost:${port}`);
  });

function injectConfig(html, apiBase, supabaseUrl, supabaseAnonKey) {
  return html
    .replace('<meta name="api-base" content="/api/v1" />', `<meta name="api-base" content="${apiBase}" />`)
    .replace('<meta name="supabase-url" content="" />', `<meta name="supabase-url" content="${supabaseUrl}" />`)
    .replace('<meta name="supabase-anon-key" content="" />', `<meta name="supabase-anon-key" content="${supabaseAnonKey}" />`);
}
