import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, Plugin } from 'vite';
import { generateBadgeSvg, BadgeStyle, BadgeTheme } from './src/utils/badgeSvg';

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
              url: 'https://topsaas.org',
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
    plugins: [react(), tailwindcss(), badgeServerPlugin()],
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
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
