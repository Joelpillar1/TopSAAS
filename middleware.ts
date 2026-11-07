/**
 * Vercel Edge Middleware for Tracking AI & LLM Crawlers
 * (ChatGPT, Claude, Perplexity, Gemini, DeepSeek, Applebot)
 */

const AI_BOT_RE = /chatgpt-user|gptbot|claudebot|claude-web|perplexitybot|google-extended|deepseek|bytespider|applebot-extended/i;

export default function middleware(req: Request) {
  const ua = req.headers.get('user-agent') || '';
  if (AI_BOT_RE.test(ua)) {
    try {
      const url = new URL(req.url);
      fetch('https://minilytics.trackkit.workers.dev/api/sites/5y6c5l0e536b6o6v/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
        body: JSON.stringify({ path: url.pathname }),
      }).catch(() => {});
    } catch {}
  }
}

