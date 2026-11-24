import "jsr:@supabase/functions-js/edge-runtime.d.ts";

/**
 * ai-crawl-stats
 * --------------
 * Queries Cloudflare's GraphQL Analytics API for AI Crawlers:
 * Computes 100% live dynamic telemetry for the rolling 24 hours:
 * - Current 24h window vs Prior 24h window for real live % trends
 * - Status codes (< 400 Allowed vs >= 400 Unsuccessful)
 * - Hourly breakdown for interactive sparklines
 * - Live count and growth for each AI crawler operator
 *
 * Cache: 5-minute rolling window
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// 5-minute cache so live requests refresh frequently without spamming Cloudflare
let memoryCache: { data: unknown; expiresAt: number } | null = null;
const CACHE_DURATION_MS = 5 * 60 * 1000;

// All AI bot regex matchers supported by Cloudflare AI Crawl Control
const AI_BOT_MATCHERS = [
  { id: "openai", name: "OpenAI", regex: /GPTBot|ChatGPT|OAI-SearchBot/i, botTag: "GPTBot +2", isBlueBorder: true },
  { id: "google", name: "Google", regex: /Googlebot|Google-Extended/i, botTag: "Googlebot +1", isBlueBorder: true },
  { id: "microsoft", name: "Microsoft", regex: /bingbot|BingBot/i, botTag: "BingBot" },
  { id: "apple", name: "Apple", regex: /Applebot/i, botTag: "Applebot" },
  { id: "anthropic", name: "Anthropic", regex: /ClaudeBot|Claude-Web|Anthropic/i, botTag: "ClaudeBot +2" },
  { id: "baidu", name: "Baidu", regex: /Baiduspider|Baidu/i, botTag: "Baidu" },
  { id: "meta", name: "Meta", regex: /Meta-ExternalAgent|FacebookBot/i, botTag: "Meta-ExternalAgent +3" },
  { id: "perplexity", name: "Perplexity", regex: /PerplexityBot/i, botTag: "PerplexityBot +1" },
  { id: "amazon", name: "Amazon", regex: /Amazonbot/i, botTag: "Amazonbot" },
  { id: "duckduckgo", name: "DuckDuckGo", regex: /DuckAssistBot/i, botTag: "DuckAssistBot" },
];

function isAiBot(userAgent?: string): boolean {
  if (!userAgent) return false;
  return AI_BOT_MATCHERS.some((m) => m.regex.test(userAgent));
}

function formatCompactNumber(num: number): string {
  if (num >= 1000) {
    const formatted = (num / 1000).toFixed(num >= 10000 ? 0 : 2);
    return `${formatted.replace(/\.00$/, "").replace(/(\.[1-9])0$/, "")}k`;
  }
  return num.toString();
}

function calculateTrend(current: number, previous: number): { text: string; direction: "up" | "down" } {
  if (previous === 0) {
    return current > 0 ? { text: "100.00%", direction: "up" } : { text: "0.00%", direction: "up" };
  }
  const diff = current - previous;
  const pct = Math.abs((diff / previous) * 100);
  return {
    text: `${pct.toFixed(2)}%`,
    direction: diff >= 0 ? "up" : "down",
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const now = Date.now();
    if (memoryCache && memoryCache.expiresAt > now) {
      return new Response(JSON.stringify(memoryCache.data), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300",
        },
      });
    }

    const cfToken = Deno.env.get("CLOUDFLARE_API_TOKEN") || Deno.env.get("CF_API_TOKEN");
    const zoneId = Deno.env.get("CLOUDFLARE_ZONE_ID") || Deno.env.get("CF_ZONE_ID");

    if (!cfToken || !zoneId) {
      return new Response(JSON.stringify({ error: "Missing Cloudflare credentials" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Windows: Current 24h (now - 24h to now) and Prior 24h (now - 48h to now - 24h)
    const nowDate = new Date();
    const past24hDate = new Date(nowDate.getTime() - 24 * 60 * 60 * 1000);
    const past48hDate = new Date(nowDate.getTime() - 48 * 60 * 60 * 1000);

    const since = past24hDate.toISOString();
    const until = nowDate.toISOString();
    const priorSince = past48hDate.toISOString();
    const priorUntil = since;

    // Cloudflare GraphQL query: current 24h + prior 24h for live trend computation
    const query = `
      query GetLiveAICrawlTelemetry($zoneTag: String!, $since: Time!, $until: Time!, $priorSince: Time!, $priorUntil: Time!) {
        viewer {
          zones(filter: { zoneTag: $zoneTag }) {
            # Current 24-hour window
            current: httpRequestsAdaptiveGroups(
              filter: {
                datetime_geq: $since
                datetime_leq: $until
                requestSource: "eyeball"
              }
              limit: 10000
              orderBy: [datetimeHour_ASC]
            ) {
              count
              dimensions {
                datetimeHour
                userAgent
                edgeResponseStatus
              }
            }

            # Prior 24-hour window for calculating true percentage change
            prior: httpRequestsAdaptiveGroups(
              filter: {
                datetime_geq: $priorSince
                datetime_leq: $priorUntil
                requestSource: "eyeball"
              }
              limit: 10000
            ) {
              count
              dimensions {
                userAgent
                edgeResponseStatus
              }
            }
          }
        }
      }
    `;

    const cfResponse = await fetch("https://api.cloudflare.com/client/v4/graphql", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${cfToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: {
          zoneTag: zoneId,
          since,
          until,
          priorSince,
          priorUntil,
        },
      }),
    });

    if (!cfResponse.ok) {
      throw new Error(`Cloudflare API returned ${cfResponse.status}`);
    }

    const cfJson = await cfResponse.json();
    const zoneData = cfJson?.data?.viewer?.zones?.[0];
    const currentRecords = zoneData?.current || [];
    const priorRecords = zoneData?.prior || [];

    // Filter strictly for AI bots in both windows
    const currentAiRecords = currentRecords.filter((r: { dimensions?: { userAgent?: string } }) =>
      isAiBot(r.dimensions?.userAgent)
    );
    const priorAiRecords = priorRecords.filter((r: { dimensions?: { userAgent?: string } }) =>
      isAiBot(r.dimensions?.userAgent)
    );

    // Dynamic metrics computation
    let totalAiCount = 0;
    let allowedAiCount = 0;
    let unsuccessfulAiCount = 0;

    const hourlyAllowedMap: Record<string, number> = {};
    const hourlyUnsuccessfulMap: Record<string, number> = {};
    const currentBotCounts: Record<string, number> = {};

    for (const rec of currentAiRecords) {
      const count = rec.count || 0;
      totalAiCount += count;

      const status = rec.dimensions?.edgeResponseStatus || 200;
      const isAllowed = status < 400;

      if (isAllowed) {
        allowedAiCount += count;
      } else {
        unsuccessfulAiCount += count;
      }

      const hour = rec.dimensions?.datetimeHour || "unknown";
      if (isAllowed) {
        hourlyAllowedMap[hour] = (hourlyAllowedMap[hour] || 0) + count;
      } else {
        hourlyUnsuccessfulMap[hour] = (hourlyUnsuccessfulMap[hour] || 0) + count;
      }

      const ua = rec.dimensions?.userAgent || "";
      for (const matcher of AI_BOT_MATCHERS) {
        if (matcher.regex.test(ua)) {
          currentBotCounts[matcher.id] = (currentBotCounts[matcher.id] || 0) + count;
          break;
        }
      }
    }

    // Prior 24h metrics for live trend comparisons
    let priorTotalCount = 0;
    let priorAllowedCount = 0;
    let priorUnsuccessfulCount = 0;
    const priorBotCounts: Record<string, number> = {};

    for (const rec of priorAiRecords) {
      const count = rec.count || 0;
      priorTotalCount += count;

      const status = rec.dimensions?.edgeResponseStatus || 200;
      if (status < 400) {
        priorAllowedCount += count;
      } else {
        priorUnsuccessfulCount += count;
      }

      const ua = rec.dimensions?.userAgent || "";
      for (const matcher of AI_BOT_MATCHERS) {
        if (matcher.regex.test(ua)) {
          priorBotCounts[matcher.id] = (priorBotCounts[matcher.id] || 0) + count;
          break;
        }
      }
    }

    // Calculate real live percentage changes
    const totalTrend = calculateTrend(totalAiCount, priorTotalCount);
    const allowedTrend = calculateTrend(allowedAiCount, priorAllowedCount);
    const unsuccessfulTrend = calculateTrend(unsuccessfulAiCount, priorUnsuccessfulCount);

    // Build timeline series from all recorded hours
    const allHours = Array.from(
      new Set([...Object.keys(hourlyAllowedMap), ...Object.keys(hourlyUnsuccessfulMap)])
    ).filter(h => h !== "unknown").sort();

    let sparklineData: Array<{ hour: string; label: string; allowed: number; unsuccessful: number; total: number }> = [];

    if (allHours.length > 0) {
      sparklineData = allHours.map((h) => {
        const d = new Date(h);
        const timeLabel = isNaN(d.getTime())
          ? h
          : d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
        const allowed = hourlyAllowedMap[h] || 0;
        const unsuccessful = hourlyUnsuccessfulMap[h] || 0;
        return {
          hour: h,
          label: timeLabel,
          allowed,
          unsuccessful,
          total: allowed + unsuccessful,
        };
      });
    }

    // Ensure 24 data slots representing 24 hours
    while (sparklineData.length < 24) {
      const idx = sparklineData.length;
      sparklineData.unshift({
        hour: `hour-${idx}`,
        label: `${idx}:00`,
        allowed: 0,
        unsuccessful: 0,
        total: 0,
      });
    }

    const sparklinesTotal = sparklineData.map((s) => s.total);
    const sparklinesAllowed = sparklineData.map((s) => s.allowed);
    const sparklinesUnsuccessful = sparklineData.map((s) => s.unsuccessful);

    // Build live crawler cards
    const crawlersResult = AI_BOT_MATCHERS.map((m) => {
      const currentCount = currentBotCounts[m.id] || 0;
      const priorCount = priorBotCounts[m.id] || 0;
      const trend = calculateTrend(currentCount, priorCount);

      return {
        id: m.id,
        name: m.name,
        botTag: m.botTag,
        allowedRequests: formatCompactNumber(currentCount),
        rawCount: currentCount,
        trend: trend.text,
        trendDirection: trend.direction,
        isBlueBorder: m.isBlueBorder,
      };
    });

    const result = {
      isLive: true,
      source: "cloudflare_graphql",
      lastUpdated: new Date().toISOString(),
      periodLabel: "Last 24 hours",
      metrics: {
        totalRequests: {
          value: formatCompactNumber(totalAiCount),
          count: totalAiCount,
          trend: totalTrend.text,
          trendDirection: totalTrend.direction,
        },
        allowedRequests: {
          value: formatCompactNumber(allowedAiCount),
          count: allowedAiCount,
          trend: allowedTrend.text,
          trendDirection: allowedTrend.direction,
        },
        unsuccessfulRequests: {
          value: unsuccessfulAiCount.toString(),
          count: unsuccessfulAiCount,
          trend: unsuccessfulTrend.text,
          trendDirection: unsuccessfulTrend.direction,
        },
      },
      timeSeries: sparklineData.map(s => ({ hour: s.hour, label: s.label, count: s.total, allowed: s.allowed, unsuccessful: s.unsuccessful })),
      sparklines: {
        total: sparklinesTotal,
        allowed: sparklinesAllowed,
        unsuccessful: sparklinesUnsuccessful,
      },
      crawlers: crawlersResult,
    };

    // Cache in memory for 5 minutes
    memoryCache = {
      data: result,
      expiresAt: now + CACHE_DURATION_MS,
    };

    return new Response(JSON.stringify(result), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("ai-crawl-stats error:", errorMsg);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
