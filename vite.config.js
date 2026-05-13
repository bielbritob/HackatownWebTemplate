import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vite';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

const ASSET_MIME = {
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png',
  '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff'
};

function serveRepoAssets() {
  const root = path.join(__dirname, 'assets');
  return {
    name: 'serve-repo-assets',
    configureServer(server) {
      server.middlewares.use('/assets', (req, res, next) => {
        const raw = (req.url || '').split('?')[0];
        const rel = decodeURIComponent(raw.replace(/^\//, '') || '');
        if (!rel || rel.includes('..')) return next();
        const file = path.join(root, rel);
        const resolvedRoot = path.resolve(root);
        if (!file.startsWith(resolvedRoot)) return next();
        fs.stat(file, (err, st) => {
          if (err || !st.isFile()) return next();
          const ext = path.extname(file).toLowerCase();
          res.setHeader('Content-Type', ASSET_MIME[ext] || 'application/octet-stream');
          fs.createReadStream(file).pipe(res);
        });
      });
    }
  };
}

export default defineConfig({
  root: __dirname,
  appType: 'mpa',
  plugins: [serveRepoAssets()],
  server: {
    host: '0.0.0.0', // Escuta em todas as interfaces
    port: 5173,
    strictPort: true,
    // Se 'all' falha, passamos um array com o caractere curinga
    allowedHosts: ['.tunnelmole.net', '.holeo.site', 'localhost', '127.0.0.1'],
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
        ws: true
      },
      '/projeto_php': {
        target: 'http://127.0.0.1:80',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/projeto_php/, '/projeto_01_hackatown')
      }
    }
  },
  build: {
    rollupOptions: {
      input: {
        faroniLanding: path.resolve(__dirname, 'Faroni/Landing/index.html'),
        faroniVitrine: path.resolve(__dirname, 'Faroni/Vitrine/index.html'),
        faroniAdmin: path.resolve(__dirname, 'Faroni/AdminPage/admin.html'),
        faroniLogin: path.resolve(__dirname, 'Faroni/LoginAdmin/LoginAdmin.html'),
        engLanding: path.resolve(__dirname, '3AENGENHARIA/Landing/index.html'),
        engVitrine: path.resolve(__dirname, '3AENGENHARIA/Vitrine/index.html'),
        painelAtendimento: path.resolve(__dirname, 'painel-atendimento/index.html')
      }
    }
  }
});
