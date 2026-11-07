// Cloudflare Pages edge middleware to track AI & LLM citations with Trackkit
const AI_BOT_RE = /chatgpt-user|gptbot|claudebot|claude-web|perplexitybot|google-extended|deepseek|bytespider|applebot/i;

interface PagesContext {
  request: Request;
  next: (input?: Request | string, init?: RequestInit) => Promise<Response>;
  waitUntil: (promise: Promise<unknown>) => void;
  [key: string]: unknown;
}

export const onRequest = async (context: PagesContext) => {
  const ua = context.request.headers.get('user-agent') || '';
  const url = new URL(context.request.url);

  // Asynchronously record bot request without delaying page response
  if (AI_BOT_RE.test(ua)) {
    context.waitUntil(
      fetch('https://minilytics.trackkit.workers.dev/api/sites/5y6c5l0e536b6o6v/bot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'User-Agent': ua },
        body: JSON.stringify({ path: url.pathname }),
      }).catch(() => {})
    );
  }

  return context.next();
};
