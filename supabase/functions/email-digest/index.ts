import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const LAUNCH_EPOCH_START = new Date(2026, 10, 2, 0, 0, 0, 0).getTime();
const WEEK_MS = 7 * 86_400_000;

function getCurrentWeekNumber(ts = Date.now()): number {
  if (ts < LAUNCH_EPOCH_START) return 1;
  return Math.floor((ts - LAUNCH_EPOCH_START) / WEEK_MS) + 1;
}

async function triggerSendEmail(
  supabaseUrl: string,
  serviceKey: string,
  payload: {
    type: string;
    to: string;
    idempotencyKey: string;
    data: Record<string, unknown>;
  }
): Promise<boolean> {
  try {
    const res = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${serviceKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    return res.ok;
  } catch (err) {
    console.warn("email-digest triggerSendEmail error:", err);
    return false;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    if (!supabaseUrl || !serviceKey) {
      return new Response(
        JSON.stringify({ error: "Supabase env vars missing" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    let mode: "daily" | "weekly" | "all" = "daily";
    try {
      const body = await req.json();
      if (body?.mode === "weekly" || body?.mode === "all") {
        mode = body.mode;
      }
    } catch {
      // default daily
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const now = Date.now();
    const summary = {
      draftReminders: 0,
      sponsorExpiring: 0,
      sponsorEnded: 0,
      weeklyDigests: 0,
    };

    // ── 1. Daily checks: abandoned drafts + sponsor expiry ──
    if (mode === "daily" || mode === "all") {
      // 1a. Abandoned drafts (updated 24h..7d ago)
      const oneDayAgoIso = new Date(now - 24 * 3600 * 1000).toISOString();
      const sevenDaysAgoIso = new Date(now - 7 * 86400 * 1000).toISOString();

      const { data: drafts } = await supabase
        .from("user_drafts")
        .select("id, user_id, name, url, step, updated_at")
        .lte("updated_at", oneDayAgoIso)
        .gte("updated_at", sevenDaysAgoIso);

      if (drafts && drafts.length > 0) {
        const userIds = [...new Set(drafts.map((d) => d.user_id))];
        const [{ data: profiles }, { data: existingSubs }] = await Promise.all([
          supabase.from("profiles").select("id, email").in("id", userIds),
          supabase.from("submissions").select("submitted_by, url").in("submitted_by", userIds),
        ]);

        const emailByUser = new Map<string, string>();
        for (const p of profiles || []) {
          if (p.email) emailByUser.set(p.id, p.email);
        }

        const submittedUrlsByUser = new Set<string>();
        for (const s of existingSubs || []) {
          if (s.submitted_by && s.url) {
            submittedUrlsByUser.add(
              `${s.submitted_by}:${String(s.url).toLowerCase().replace(/\/$/, "")}`
            );
          }
        }

        for (const draft of drafts) {
          const to = emailByUser.get(draft.user_id);
          if (!to) continue;
          const normUrl = String(draft.url || "").toLowerCase().replace(/\/$/, "");
          if (normUrl && submittedUrlsByUser.has(`${draft.user_id}:${normUrl}`)) {
            continue;
          }
          const ok = await triggerSendEmail(supabaseUrl, serviceKey, {
            type: "draft_reminder",
            to,
            idempotencyKey: `draft_reminder:${draft.id}`,
            data: {
              productName: draft.name || "your SaaS",
              step: draft.step ?? 0,
            },
          });
          if (ok) summary.draftReminders++;
        }
      }

      // 1b. Sponsors expiring within 48h & Sponsors just expired
      const { data: activeSponsors } = await supabase
        .from("sponsors")
        .select("id, name, contact_email, expires_at, clicks, status")
        .eq("status", "active");

      for (const sp of activeSponsors || []) {
        if (!sp.expires_at) continue;
        const msLeft = sp.expires_at - now;

        if (msLeft <= 0) {
          await supabase
            .from("sponsors")
            .update({ status: "expired", updated_at: now })
            .eq("id", sp.id);

          if (sp.contact_email) {
            const ok = await triggerSendEmail(supabaseUrl, serviceKey, {
              type: "sponsor_ended",
              to: sp.contact_email,
              idempotencyKey: `sponsor_ended:${sp.id}:${sp.expires_at}`,
              data: {
                productName: sp.name,
                clicks: sp.clicks ?? 0,
              },
            });
            if (ok) summary.sponsorEnded++;
          }
        } else if (msLeft <= 48 * 3600 * 1000 && sp.contact_email) {
          const hoursLeft = Math.max(1, Math.round(msLeft / 3600000));
          const ok = await triggerSendEmail(supabaseUrl, serviceKey, {
            type: "sponsor_expiring",
            to: sp.contact_email,
            idempotencyKey: `sponsor_expiring:${sp.id}:${sp.expires_at}`,
            data: {
              productName: sp.name,
              clicks: sp.clicks ?? 0,
              hoursLeft,
            },
          });
          if (ok) summary.sponsorExpiring++;
        }
      }
    }

    // ── 2. Weekly progress digest ──
    if (mode === "weekly" || mode === "all") {
      const weekNumber = getCurrentWeekNumber(now);
      const { data: liveProducts } = await supabase
        .from("products")
        .select("id, name, slug, rank, upvotes, clicks, submitted_by, sponsor_contact_email, is_sponsor_only")
        .order("rank", { ascending: true });

      const directoryProducts = (liveProducts || []).filter((p) => !p.is_sponsor_only);
      const ownerIds = [...new Set(directoryProducts.map((p) => p.submitted_by).filter(Boolean))];

      const [{ data: ownerProfiles }, { data: ownerSubs }] = await Promise.all([
        ownerIds.length > 0
          ? supabase.from("profiles").select("id, email").in("id", ownerIds)
          : Promise.resolve({ data: [] }),
        supabase.from("submissions").select("id, backer_email, submitted_by"),
      ]);

      const emailByUser = new Map<string, string>();
      for (const p of ownerProfiles || []) {
        if (p.email) emailByUser.set(p.id, p.email);
      }

      const emailBySubId = new Map<string, string>();
      for (const s of ownerSubs || []) {
        if (s.backer_email) emailBySubId.set(`prod-${s.id}`, s.backer_email);
      }

      for (const prod of directoryProducts) {
        const to =
          emailBySubId.get(prod.id) ||
          (prod.submitted_by ? emailByUser.get(prod.submitted_by) : undefined) ||
          prod.sponsor_contact_email;
        if (!to) continue;

        const ok = await triggerSendEmail(supabaseUrl, serviceKey, {
          type: "weekly_digest",
          to,
          idempotencyKey: `weekly_digest:W${weekNumber}:${prod.id}`,
          data: {
            productName: prod.name,
            slug: prod.slug || prod.id,
            rank: prod.rank || 0,
            upvotes: prod.upvotes || 0,
            clicks: prod.clicks || 0,
            weekNumber,
          },
        });
        if (ok) summary.weeklyDigests++;
      }
    }

    return new Response(JSON.stringify({ ok: true, mode, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("email-digest error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

