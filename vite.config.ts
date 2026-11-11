import 'dotenv/config';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { generateBadgeSvg, BadgeStyle, BadgeTheme } from './src/utils/badgeSvg';
import autofillHandler from './api/autofill-submission';
import verifyBadgeHandler from './api/verify-badge';

function apiDevServerPlugin(): Plugin {
  return {
    name: 'api-dev-server-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const AI_BOT_RE = /chatgpt-user|gptbot|claudebot|claude-web|perplexitybot|google-extended|deepseek|bytespider|applebot-extended/i;
        const ua = (req.headers['user-agent'] as string) || '';
        if (AI_BOT_RE.test(ua)) {
          fetch('https://minilytics.trackkit.workers.dev/api/sites/5y6c5l0e536b6o6v/bot', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
            body: JSON.stringify({ path: req.url || '/' }),
          }).catch(() => {});
        }

        const isAutofill = req.url && req.url.startsWith('/api/autofill-submission');
        const isVerifyBadge = req.url && req.url.startsWith('/api/verify-badge');

        if (isAutofill || isVerifyBadge) {
          let rawBody = '';
          req.on('data', (chunk) => {
            rawBody += chunk;
          });
          req.on('end', async () => {
            try {
              (req as any).body = rawBody ? JSON.parse(rawBody) : {};
            } catch {
              (req as any).body = {};
            }
            try {
              const parsedUrl = new URL(req.url || '', 'http://localhost:3000');
              (req as any).query = Object.fromEntries(parsedUrl.searchParams.entries());
            } catch {
              (req as any).query = {};
            }

            const wrappedRes = {
              statusCode: 200,
              setHeader(name: string, value: string) {
                res.setHeader(name, value);
              },
              json(data: any) {
                res.statusCode = this.statusCode;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify(data));
              },
              end(data?: any) {
                res.statusCode = this.statusCode;
                res.end(data);
              },
            };

            try {
              if (isAutofill) {
                await autofillHandler(req, wrappedRes);
              } else {
                await verifyBadgeHandler(req, wrappedRes);
              }
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: err?.message || 'Server error' }));
            }
          });
          return;
        }
        next();
      });
    },
  };
}

function badgeServerPlugin(): Plugin {
  return {
    name: 'badge-server-middleware',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url && req.url.startsWith('/badge/')) {
          try {
            const urlObj = new URL(req.url, 'http://localhost:3000');
            const pathname = urlObj.pathname;
            const productId = decodeURIComponent(pathname.replace(/^\/badge\//, ''));
            const style = (urlObj.searchParams.get('style') as BadgeStyle) || 'featured';
            const theme = (urlObj.searchParams.get('theme') as BadgeTheme) || 'light';

            const isShipOs = productId.toLowerCase().includes('shipos') || productId.includes('1jotx6');
            const sampleProduct = {
              id: productId,
              name: isShipOs ? 'ShipOS' : 'TopSAAS Product',
              tagline: 'Ship faster with modern SaaS boilerplate',
              url: 'https://topsaas.space',
              category: 'Developer Tools' as const,
              rank: 1,
              upvotes: 3,
              clicks: 0,
              createdAt: Date.now(),
              updatedAt: Date.now(),
            };

            const svg = generateBadgeSvg(sampleProduct, { style, theme });
            res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
            res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.end(svg);
            return;
          } catch (err) {
            console.error('Error generating badge SVG in middleware:', err);
          }
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), badgeServerPlugin(), apiDevServerPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'border-beam': path.resolve(__dirname, 'src/components/BorderBeam.tsx'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâ€”file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {
        // Exclude the entire public/ directory — static assets don't need HMR
        // and Windows locks files with spaces in their names (EBUSY crash).
        ignored: ['**/public/**'],
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
              if (id.includes('@supabase')) return 'vendor-supabase';
              if (id.includes('lucide-react')) return 'vendor-lucide';
              if (id.includes('canvas-confetti')) return 'vendor-confetti';
            }
          },
        },
      },
      chunkSizeWarningLimit: 1200,
    },
  };
});
