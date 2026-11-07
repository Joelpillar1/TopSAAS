import { next } from '@vercel/edge';

const AI_BOT_RE = /chatgpt-user|gptbot|claudebot|claude-web|perplexitybot|google-extended|deepseek|bytespider|applebot/i;

export default function middleware(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  const url = new URL(req.url);

  if (AI_BOT_RE.test(ua)) {
    fetch('https://minilytics.trackkit.workers.dev/api/sites/5y6c5l0e536b6o6v/bot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
      body: JSON.stringify({ path: url.pathname }),
    }).catch(() => {});
  }

  return next();
}
