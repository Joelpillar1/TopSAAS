import { supabase } from './supabase';

export interface CrawlerStatItem {
  id: string;
  name: string;
  botTag: string;
  allowedRequests: string;
  rawCount?: number;
  trend?: string;
  trendDirection?: 'up' | 'down';
  isBlueBorder?: boolean;
}

export interface MetricSummary {
  value: string;
  count: number;
  trend: string;
  trendDirection: 'up' | 'down';
}

export interface TimeSeriesPoint {
  hour: string;
  label: string;
  count: number;
}

export interface AiCrawlTelemetryData {
  isLive: boolean;
  source: 'cloudflare_graphql' | 'verified_snapshot';
  lastUpdated: string;
  periodLabel: string;
  metrics: {
    totalRequests: MetricSummary;
    allowedRequests: MetricSummary;
    unsuccessfulRequests: MetricSummary;
  };
  timeSeries?: TimeSeriesPoint[];
  sparklines: {
    total: number[];
    allowed: number[];
    unsuccessful: number[];
  };
  crawlers: CrawlerStatItem[];
}

export const DEFAULT_AI_CRAWL_TELEMETRY: AiCrawlTelemetryData = {
  isLive: false,
  source: 'verified_snapshot',
  lastUpdated: new Date().toISOString(),
  periodLabel: 'Last 24 hours',
  metrics: {
    totalRequests: {
      value: '4k',
      count: 4000,
      trend: '87.80%',
      trendDirection: 'up',
    },
    allowedRequests: {
      value: '4k',
      count: 4000,
      trend: '89.25%',
      trendDirection: 'up',
    },
    unsuccessfulRequests: {
      value: '13',
      count: 13,
      trend: '48.00%',
      trendDirection: 'down',
    },
  },
  timeSeries: [
    { hour: 'h-0', label: '12:00 AM', count: 23 },
    { hour: 'h-1', label: '1:00 AM', count: 12 },
    { hour: 'h-2', label: '2:00 AM', count: 10 },
    { hour: 'h-3', label: '3:00 AM', count: 17 },
    { hour: 'h-4', label: '4:00 AM', count: 18 },
    { hour: 'h-5', label: '5:00 AM', count: 3861 },
    { hour: 'h-6', label: '6:00 AM', count: 4 },
    { hour: 'h-7', label: '7:00 AM', count: 63 },
    { hour: 'h-8', label: '8:00 AM', count: 11 },
    { hour: 'h-9', label: '9:00 AM', count: 5 },
    { hour: 'h-10', label: '10:00 AM', count: 52 },
    { hour: 'h-11', label: '11:00 AM', count: 13 },
  ],
  sparklines: {
    total: [31, 34, 62, 27, 7, 10, 13, 15, 33, 30, 23, 50, 98, 23, 12, 10, 17, 18, 3861, 4, 63, 11, 5, 52, 13],
    allowed: [31, 34, 62, 27, 7, 10, 13, 15, 33, 30, 23, 50, 98, 23, 12, 10, 17, 18, 3861, 4, 63, 11, 5, 52, 13],
    unsuccessful: [1, 0, 1, 0, 2, 0, 1, 0, 1, 2, 1, 0, 1, 2, 1, 3, 2, 4, 3, 5, 8, 11, 12, 13],
  },
  crawlers: [
    {
      id: 'openai',
      name: 'OpenAI',
      botTag: 'GPTBot +2',
      allowedRequests: '3.86k',
      trend: '27,485.71%',
      trendDirection: 'up',
      isBlueBorder: true,
    },
    {
      id: 'google',
      name: 'Google',
      botTag: 'Googlebot +1',
      allowedRequests: '304',
      trend: '38.18%',
      trendDirection: 'up',
      isBlueBorder: true,
    },
    {
      id: 'microsoft',
      name: 'Microsoft',
      botTag: 'BingBot',
      allowedRequests: '70',
      trend: '45.74%',
      trendDirection: 'down',
    },
    {
      id: 'apple',
      name: 'Apple',
      botTag: 'Applebot',
      allowedRequests: '70',
      trend: '96.30%',
      trendDirection: 'down',
    },
    {
      id: 'anthropic',
      name: 'Anthropic',
      botTag: 'ClaudeBot +2',
      allowedRequests: '54',
    },
    {
      id: 'baidu',
      name: 'Baidu',
      botTag: 'Baidu',
      allowedRequests: '29',
      trend: '123.08%',
      trendDirection: 'up',
    },
    {
      id: 'meta',
      name: 'Meta',
      botTag: 'Meta-ExternalAgent +3',
      allowedRequests: '21',
      trend: '57.14%',
      trendDirection: 'down',
    },
    {
      id: 'perplexity',
      name: 'Perplexity',
      botTag: 'PerplexityBot +1',
      allowedRequests: '4',
    },
    {
      id: 'amazon',
      name: 'Amazon',
      botTag: 'Amazonbot',
      allowedRequests: '3',
    },
    {
      id: 'duckduckgo',
      name: 'DuckDuckGo',
      botTag: 'DuckAssistBot',
      allowedRequests: '1',
      trend: '50.00%',
      trendDirection: 'down',
    },
  ],
};

let cachedTelemetry: AiCrawlTelemetryData | null = null;

export async function fetchAiCrawlTelemetry(): Promise<AiCrawlTelemetryData> {
  if (cachedTelemetry) {
    return cachedTelemetry;
  }

  try {
    const { data, error } = await supabase.functions.invoke('ai-crawl-stats');
    if (!error && data && data.metrics) {
      cachedTelemetry = data as AiCrawlTelemetryData;
      return cachedTelemetry;
    }
  } catch (err) {
    console.debug('Edge function invoke failed:', err);
  }

  try {
    const res = await fetch('https://mwzwcbqzczlgyokgvyzx.supabase.co/functions/v1/ai-crawl-stats');
    if (res.ok) {
      const json = await res.json();
      if (json && json.metrics) {
        cachedTelemetry = json as AiCrawlTelemetryData;
        return cachedTelemetry;
      }
    }
  } catch {
    // Fall back to verified baseline
  }

  cachedTelemetry = DEFAULT_AI_CRAWL_TELEMETRY;
  return cachedTelemetry;
}
