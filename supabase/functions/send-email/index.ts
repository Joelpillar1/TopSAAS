import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_URL = "https://www.topsaas.space";
const LOGO_URL = "https://www.topsaas.space/logo/TopSAAS%20-%20blue.png";
const DEFAULT_FROM = "TopSAAS <notifications@topsaas.space>";
const DEFAULT_REPLY_TO = "hello@topsaas.space";

export type EmailType =
  | "submission_received"
  | "submission_approved"
  | "submission_rejected"
  | "payment_receipt"
  | "new_comment"
  | "sponsor_live"
  | "milestone"
  | "draft_reminder"
  | "sponsor_expiring"
  | "sponsor_ended"
  | "weekly_digest"
  | "welcome_founder"
  | "welcome_user";

interface SendEmailPayload {
  type: EmailType;
  to: string;
  data?: Record<string, unknown>;
  idempotencyKey?: string;
}

function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

type BadgeTone = "blue" | "green" | "amber" | "red" | "neutral";

function getBadgeStyle(tone: BadgeTone): { bg: string; fg: string; border: string; className: string } {
  switch (tone) {
    case "green":
      return { bg: "#ecfdf5", fg: "#047857", border: "#a7f3d0", className: "badge-green" };
    case "amber":
      return { bg: "#fffbeb", fg: "#b45309", border: "#fde68a", className: "badge-amber" };
    case "red":
      return { bg: "#fef2f2", fg: "#b91c1c", border: "#fecaca", className: "badge-red" };
    case "blue":
      return { bg: "#eff6ff", fg: "#1d4ed8", border: "#bfdbfe", className: "badge-blue" };
    default:
      return { bg: "#f1f5f9", fg: "#334155", border: "#e2e8f0", className: "badge-neutral" };
  }
}

function wrapLayout(params: {
  preheader: string;
  badge: string;
  tone?: BadgeTone;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const { preheader, badge, tone = "blue", heading, bodyHtml, ctaLabel, ctaUrl } = params;
  const badgeStyle = getBadgeStyle(tone);

  const ctaBlock =
    ctaLabel && ctaUrl
      ? `<div style="margin:26px 0 4px;">
          <a href="${escapeHtml(ctaUrl)}" class="email-cta" style="display:inline-block;background-color:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;line-height:1;padding:13px 22px;border-radius:8px;letter-spacing:-0.01em;">
            ${escapeHtml(ctaLabel)} &rarr;
          </a>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1.0" />
  <meta name="color-scheme" content="light dark" />
  <meta name="supported-color-schemes" content="light dark" />
  <title>${escapeHtml(heading)}</title>
  <style>
    :root {
      color-scheme: light dark;
      supported-color-schemes: light dark;
    }
    @media (prefers-color-scheme: dark) {
      body, .email-bg {
        background-color: #070a12 !important;
        color: #f8fafc !important;
      }
      .email-card {
        background-color: #0f172a !important;
        border-color: #1e293b !important;
      }
      .email-header {
        border-bottom-color: #1e293b !important;
      }
      .email-brand, .email-heading, .email-strong, .stat-value {
        color: #f8fafc !important;
      }
      .email-body {
        color: #cbd5e1 !important;
      }
      .email-muted, .stat-label {
        color: #94a3b8 !important;
      }
      .email-footer {
        background-color: #0b1120 !important;
        border-top-color: #1e293b !important;
        color: #94a3b8 !important;
      }
      .email-footer a {
        color: #e2e8f0 !important;
      }
      .email-cta {
        background-color: #2563eb !important;
        color: #ffffff !important;
      }
      .email-quote {
        background-color: #1e293b !important;
        border-left-color: #3b82f6 !important;
        color: #e2e8f0 !important;
      }
      .email-alert-red {
        background-color: #2a1215 !important;
        border-color: #7f1d1d !important;
        color: #fecaca !important;
      }
      .stat-box {
        background-color: #0b1120 !important;
        border-color: #1e293b !important;
      }
      .stat-cell {
        border-right-color: #1e293b !important;
      }
      .badge-blue { background-color: #172554 !important; color: #93c5fd !important; border-color: #1e40af !important; }
      .badge-green { background-color: #064e3b !important; color: #6ee7b7 !important; border-color: #047857 !important; }
      .badge-amber { background-color: #451a03 !important; color: #fcd34d !important; border-color: #92400e !important; }
      .badge-red { background-color: #450a0a !important; color: #fca5a5 !important; border-color: #991b1b !important; }
      .badge-neutral { background-color: #1e293b !important; color: #cbd5e1 !important; border-color: #334155 !important; }
    }
    [data-ogsc] .email-bg { background-color: #070a12 !important; }
    [data-ogsc] .email-card { background-color: #0f172a !important; border-color: #1e293b !important; }
    [data-ogsc] .email-heading, [data-ogsc] .email-brand { color: #f8fafc !important; }
    [data-ogsc] .email-body { color: #cbd5e1 !important; }
    [data-ogsc] .email-cta { background-color: #2563eb !important; color: #ffffff !important; }
  </style>
</head>
<body class="email-bg" style="margin:0;padding:0;background-color:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0b0f19;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(preheader)}</div>
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-bg" style="background-color:#f8fafc;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="email-card" style="max-width:560px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
          <!-- Brand Header -->
          <tr>
            <td class="email-header" style="padding:22px 28px;border-bottom:1px solid #f1f5f9;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="left" valign="middle">
                    <a href="${SITE_URL}" style="text-decoration:none;display:inline-flex;align-items:center;">
                      <img src="${LOGO_URL}" alt="TopSAAS" width="26" height="26" style="display:inline-block;vertical-align:middle;border-radius:6px;margin-right:9px;" />
                      <span class="email-brand" style="font-weight:800;font-size:17px;color:#0b0f19;letter-spacing:-0.02em;vertical-align:middle;">TopSAAS</span>
                    </a>
                  </td>
                  <td align="right" valign="middle">
                    <span class="${badgeStyle.className}" style="display:inline-block;background-color:${badgeStyle.bg};color:${badgeStyle.fg};border:1px solid ${badgeStyle.border};font-size:11px;font-weight:700;padding:4px 10px;border-radius:999px;letter-spacing:0.01em;">
                      ${escapeHtml(badge)}
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Main Content -->
          <tr>
            <td style="padding:28px 28px 26px;">
              <h1 class="email-heading" style="margin:0 0 14px;font-size:21px;line-height:1.3;font-weight:800;color:#0b0f19;letter-spacing:-0.02em;">${escapeHtml(heading)}</h1>
              <div class="email-body" style="font-size:15px;line-height:1.65;color:#374151;">
                ${bodyHtml}
              </div>
              ${ctaBlock}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td class="email-footer" style="padding:18px 28px;background-color:#f8fafc;border-top:1px solid #f1f5f9;font-size:12px;line-height:1.6;color:#64748b;">
              <div style="margin-bottom:4px;">
                <a href="${SITE_URL}" style="color:#0b0f19;text-decoration:none;font-weight:700;">TopSAAS</a> &middot;
                <a href="${SITE_URL}/pricing" style="color:#475569;text-decoration:none;">Pricing</a> &middot;
                <a href="${SITE_URL}/profile" style="color:#475569;text-decoration:none;">Dashboard</a>
              </div>
              <div>Questions? Just reply to this email (<a href="mailto:${DEFAULT_REPLY_TO}" style="color:#0b0f19;text-decoration:none;">${DEFAULT_REPLY_TO}</a>).</div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildEmailContent(
  type: EmailType,
  data: Record<string, unknown> = {}
): { subject: string; html: string; text: string } {
  const productName = String(data.productName || "Your product");
  const slug = data.slug ? String(data.slug) : "";
  const productUrl = slug ? `${SITE_URL}/product/${encodeURIComponent(slug)}` : SITE_URL;

  switch (type) {
    case "submission_received": {
      const isVerified = Boolean(data.isVerified);
      const scheduledWeekLabel = data.scheduledWeekLabel
        ? String(data.scheduledWeekLabel)
        : "";
      const queueText = isVerified
        ? "Your <strong>Verified Launch</strong> is in the fast-track queue and will be reviewed within <strong>24 hours</strong>."
        : "Your submission is in our standard review queue (typically <strong>7–14 days</strong>).";
      const weekLine = scheduledWeekLabel
        ? `<p style="margin:12px 0 0;">Scheduled Launch Round: <strong>${escapeHtml(scheduledWeekLabel)}</strong></p>`
        : "";

      return {
        subject: `We received ${productName} on TopSAAS`,
        html: wrapLayout({
          preheader: `${productName} has been submitted to TopSAAS.`,
          badge: isVerified ? "Fast-Track Review" : "Under Review",
          tone: isVerified ? "green" : "blue",
          heading: `${productName} is in the review queue`,
          bodyHtml: `<p style="margin:0 0 12px;">Thanks for submitting <strong>${escapeHtml(productName)}</strong> to TopSAAS!</p>
            <p style="margin:0;">${queueText}</p>
            ${weekLine}
            <p style="margin:14px 0 0;">We'll email you as soon as your listing goes live.</p>`,
          ctaLabel: "View Your Profile",
          ctaUrl: `${SITE_URL}/profile`,
        }),
        text: `Thanks for submitting ${productName} to TopSAAS!\n\n${
          isVerified
            ? "Your Verified Launch is in the fast-track queue (reviewed within 24 hours)."
            : "Your submission is in our standard review queue (7-14 days)."
        }${scheduledWeekLabel ? `\nScheduled Launch Round: ${scheduledWeekLabel}` : ""}\n\nWe'll email you as soon as your listing goes live.\n\n${SITE_URL}/profile`,
      };
    }

    case "submission_approved": {
      const isVerified = Boolean(data.isVerified);
      return {
        subject: `${productName} is now live on TopSAAS!`,
        html: wrapLayout({
          preheader: `${productName} has been approved and is live on TopSAAS.`,
          badge: isVerified ? "Verified Live" : "Approved",
          tone: "green",
          heading: `${productName} is live on TopSAAS!`,
          bodyHtml: `<p style="margin:0 0 12px;">Great news — <strong>${escapeHtml(productName)}</strong> has been approved and is now live in the TopSAAS directory.</p>
            <p style="margin:0 0 12px;">Share your listing with your community to start climbing the weekly leaderboard with upvotes and visits.</p>
            ${
              isVerified
                ? `<p style="margin:0;">Your <strong>Verified Mint Badge</strong> and permanent DoFollow backlink are active. You can grab your embeddable badge anytime from your profile.</p>`
                : ""
            }`,
          ctaLabel: `View ${productName} Live`,
          ctaUrl: productUrl,
        }),
        text: `Great news! ${productName} has been approved and is now live on TopSAAS.\n\nView your listing: ${productUrl}\n\nShare it with your community to start climbing the weekly leaderboard!`,
      };
    }

    case "submission_rejected": {
      const reason = String(
        data.reason || "Did not meet current directory guidelines."
      );
      return {
        subject: `Update on your ${productName} submission`,
        html: wrapLayout({
          preheader: `An update regarding your TopSAAS submission for ${productName}.`,
          badge: "Needs Changes",
          tone: "red",
          heading: `Update on ${productName}`,
          bodyHtml: `<p style="margin:0 0 12px;">Thanks for submitting <strong>${escapeHtml(productName)}</strong> to TopSAAS. Unfortunately, we couldn't approve it as submitted.</p>
            <div class="email-alert-red" style="margin:14px 0;padding:12px 14px;background:#fef2f2;border:1px solid #fecaca;border-radius:10px;color:#991b1b;font-size:14px;">
              <strong>Reason:</strong> ${escapeHtml(reason)}
            </div>
            <p style="margin:0;">You can update your details and resubmit anytime, or reply to this email if you have questions.</p>`,
          ctaLabel: "Resubmit on TopSAAS",
          ctaUrl: `${SITE_URL}/submit`,
        }),
        text: `Thanks for submitting ${productName} to TopSAAS. Unfortunately, we couldn't approve it right now.\n\nReason: ${reason}\n\nYou can update your details and resubmit at ${SITE_URL}/submit, or reply to this email if you have questions.`,
      };
    }

    case "payment_receipt": {
      const planName = String(data.planName || "TopSAAS Upgrade");
      const priceLabel = data.priceLabel ? ` (${String(data.priceLabel)})` : "";
      const durationDays = data.durationDays ? Number(data.durationDays) : 0;
      const durationNote =
        durationDays > 0
          ? `<p style="margin:10px 0 0;">Active duration: <strong>${durationDays} days</strong></p>`
          : "";
      return {
        subject: `Payment confirmed: ${planName} for ${productName}`,
        html: wrapLayout({
          preheader: `Your ${planName} purchase on TopSAAS is active.`,
          badge: "Payment Confirmed",
          heading: `Your ${planName} is active`,
          bodyHtml: `<p style="margin:0 0 12px;">Thank you for upgrading <strong>${escapeHtml(productName)}</strong> on TopSAAS!</p>
            <p style="margin:0;"><strong>Plan:</strong> ${escapeHtml(planName)}${escapeHtml(priceLabel)}</p>
            ${durationNote}
            <p style="margin:12px 0 0;">Your benefits are now active on the platform.</p>`,
          ctaLabel: "Go to TopSAAS",
          ctaUrl: productUrl,
        }),
        text: `Thank you for upgrading ${productName} on TopSAAS!\n\nPlan: ${planName}${priceLabel}${
          durationDays > 0 ? `\nActive duration: ${durationDays} days` : ""
        }\n\nView on TopSAAS: ${productUrl}`,
      };
    }

    case "new_comment": {
      const commenterName = String(data.commenterName || "Someone");
      const commentSnippet = String(data.commentSnippet || "").slice(0, 300);
      return {
        subject: `New comment on ${productName} from ${commenterName}`,
        html: wrapLayout({
          preheader: `${commenterName} commented on ${productName}.`,
          badge: "New Comment",
          tone: "blue",
          heading: `${commenterName} commented on ${productName}`,
          bodyHtml: `<p style="margin:0 0 12px;">You have a new community comment on <strong>${escapeHtml(productName)}</strong>:</p>
            <blockquote class="email-quote" style="margin:14px 0;padding:12px 14px;background:#f8fafc;border-left:3px solid #2563eb;border-radius:0 8px 8px 0;color:#1e293b;">
              "${escapeHtml(commentSnippet)}"
            </blockquote>
            <p style="margin:0;">Jump in and reply to keep the conversation going!</p>`,
          ctaLabel: "Reply on TopSAAS",
          ctaUrl: productUrl,
        }),
        text: `${commenterName} commented on ${productName}:\n\n"${commentSnippet}"\n\nReply here: ${productUrl}`,
      };
    }

    case "sponsor_live": {
      const durationDays = Number(data.durationDays || 30);
      return {
        subject: `${productName} is now featured on TopSAAS`,
        html: wrapLayout({
          preheader: `Your sponsor placement for ${productName} is live.`,
          badge: "Sponsor Live",
          heading: `${productName} sponsor spotlight is live`,
          bodyHtml: `<p style="margin:0 0 12px;">Your sponsor placement for <strong>${escapeHtml(productName)}</strong> is active starting today for <strong>${durationDays} days</strong>.</p>
            <p style="margin:0;">You can track incoming referral traffic in your analytics via <code>utm_source=topsaas</code>.</p>`,
          ctaLabel: "View Live Directory",
          ctaUrl: SITE_URL,
        }),
        text: `Your sponsor placement for ${productName} is now live on TopSAAS for ${durationDays} days!\n\nTrack visitors via utm_source=topsaas.\n\n${SITE_URL}`,
      };
    }

    case "milestone": {
      const milestoneType = String(data.milestoneType || "upvotes");
      const value = String(data.value || "");
      const title =
        milestoneType === "rank"
          ? `${productName} reached #${value} on TopSAAS!`
          : milestoneType === "clicks"
            ? `${productName} just passed ${value} visits from TopSAAS!`
            : `${productName} just hit ${value} upvotes on TopSAAS!`;

      return {
        subject: title,
        html: wrapLayout({
          preheader: title,
          badge: "Progress Milestone",
          tone: "green",
          heading: title,
          bodyHtml: `<p style="margin:0 0 12px;">Momentum is building for <strong>${escapeHtml(productName)}</strong> on TopSAAS.</p>
            <p style="margin:0;">Keep sharing your listing to climb even higher in this week's leaderboard.</p>`,
          ctaLabel: "View Listing",
          ctaUrl: productUrl,
        }),
        text: `${title}\n\nView your listing: ${productUrl}`,
      };
    }

    case "draft_reminder": {
      const draftName = String(data.productName || "your SaaS");
      const stepNum = Math.min(5, Math.max(1, Number(data.step || 0) + 1));
      return {
        subject: `Finish launching ${draftName} on TopSAAS (Step ${stepNum} of 5)`,
        html: wrapLayout({
          preheader: `Your launch draft for ${draftName} is saved and ready to submit.`,
          badge: "Saved Draft",
          tone: "amber",
          heading: `Ready to finish launching ${draftName}?`,
          bodyHtml: `<p style="margin:0 0 12px;">You're on <strong>Step ${stepNum} of 5</strong> for <strong>${escapeHtml(draftName)}</strong>. Your progress is saved—pick up right where you left off and get in front of the TopSAAS community.</p>
            <p style="margin:0;">You can launch for free or fast-track with a Verified Launch.</p>`,
          ctaLabel: "Resume Your Launch",
          ctaUrl: `${SITE_URL}/submit`,
        }),
        text: `You're on Step ${stepNum} of 5 for ${draftName} on TopSAAS.\n\nYour draft is saved—resume and submit here: ${SITE_URL}/submit`,
      };
    }

    case "sponsor_expiring": {
      const clicks = Number(data.clicks || 0);
      const hoursLeft = Math.max(1, Number(data.hoursLeft || 48));
      return {
        subject: `${productName} sponsor spotlight wraps up in ${hoursLeft}h`,
        html: wrapLayout({
          preheader: `Your TopSAAS sponsor placement for ${productName} ends soon.`,
          badge: "Expiring Soon",
          tone: "amber",
          heading: `Your sponsor spot wraps up in ~${hoursLeft} hours`,
          bodyHtml: `<p style="margin:0 0 12px;">Quick update on <strong>${escapeHtml(productName)}</strong>: your sponsor placement has delivered <strong>${clicks} direct clicks</strong> so far.</p>
            <p style="margin:0;">Want to keep your spotlight active without losing momentum? Extend your placement before the slot rotates.</p>`,
          ctaLabel: "Extend Sponsor Spot",
          ctaUrl: `${SITE_URL}/pricing`,
        }),
        text: `Your sponsor spotlight for ${productName} wraps up in ~${hoursLeft} hours (${clicks} clicks delivered so far).\n\nExtend your spot here: ${SITE_URL}/pricing`,
      };
    }

    case "sponsor_ended": {
      const clicks = Number(data.clicks || 0);
      return {
        subject: `${productName} sponsor spotlight summary (${clicks} clicks)`,
        html: wrapLayout({
          preheader: `Here is your sponsor campaign wrap-up for ${productName}.`,
          badge: "Campaign Recap",
          heading: `Sponsor recap for ${productName}`,
          bodyHtml: `<p style="margin:0 0 12px;">Your sponsor spotlight for <strong>${escapeHtml(productName)}</strong> has concluded, delivering <strong>${clicks} direct clicks</strong> to your site.</p>
            <p style="margin:0;">Your standard directory listing remains live on TopSAAS forever. Whenever you're ready for another boost, you can re-book a spot in seconds.</p>`,
          ctaLabel: "Book Another Spotlight",
          ctaUrl: `${SITE_URL}/pricing`,
        }),
        text: `Your sponsor spotlight for ${productName} has concluded with ${clicks} direct clicks delivered.\n\nYour standard directory listing remains live on TopSAAS forever. Book another spot anytime: ${SITE_URL}/pricing`,
      };
    }

    case "weekly_digest": {
      const rank = Number(data.rank || 0);
      const upvotes = Number(data.upvotes || 0);
      const clicks = Number(data.clicks || 0);
      const weekNumber = Number(data.weekNumber || 1);
      return {
        subject: `Weekly TopSAAS Progress: ${productName} (#${rank || "—"})`,
        html: wrapLayout({
          preheader: `Week ${weekNumber} stats for ${productName}: ${upvotes} upvotes, ${clicks} clicks.`,
          badge: `Week ${weekNumber} Recap`,
          tone: "blue",
          heading: `Your weekly progress for ${productName}`,
          bodyHtml: `<p style="margin:0 0 14px;">Here is how <strong>${escapeHtml(productName)}</strong> is performing on TopSAAS:</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="stat-box" style="margin:0 0 14px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background-color:#f8fafc;">
              <tr>
                <td class="stat-cell" style="padding:12px;text-align:center;border-right:1px solid #e2e8f0;">
                  <div class="stat-label" style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Rank</div>
                  <div class="stat-value" style="font-size:20px;font-weight:800;color:#0b0f19;margin-top:2px;">#${rank || "—"}</div>
                </td>
                <td class="stat-cell" style="padding:12px;text-align:center;border-right:1px solid #e2e8f0;">
                  <div class="stat-label" style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Upvotes</div>
                  <div class="stat-value" style="font-size:20px;font-weight:800;color:#0b0f19;margin-top:2px;">${upvotes}</div>
                </td>
                <td style="padding:12px;text-align:center;">
                  <div class="stat-label" style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Clicks</div>
                  <div class="stat-value" style="font-size:20px;font-weight:800;color:#0b0f19;margin-top:2px;">${clicks}</div>
                </td>
              </tr>
            </table>
            <p style="margin:0;">Want to climb higher this week? Share your listing or activate Auto Weekly Relaunch ($5/week).</p>`,
          ctaLabel: `View ${productName}`,
          ctaUrl: productUrl,
        }),
        text: `Week ${weekNumber} progress for ${productName} on TopSAAS:\n- Rank: #${rank || "—"}\n- Upvotes: ${upvotes}\n- Clicks: ${clicks}\n\nView listing: ${productUrl}`,
      };
    }

    case "welcome_founder": {
      const rank = Number(data.rank || 0);
      const upvotes = Number(data.upvotes || 0);
      const clicks = Number(data.clicks || 0);
      const firstName = data.firstName ? ` ${String(data.firstName)}` : "";
      return {
        subject: `Welcome to TopSAAS — ${productName} has ${upvotes} upvotes!`,
        html: wrapLayout({
          preheader: `Welcome to TopSAAS! Here is where ${productName} stands right now.`,
          badge: "Welcome",
          tone: "green",
          heading: `Welcome to TopSAAS${firstName}!`,
          bodyHtml: `<p style="margin:0 0 12px;">Thanks for launching <strong>${escapeHtml(productName)}</strong> on TopSAAS. Here is a quick snapshot of how your listing is performing right now:</p>
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" class="stat-box" style="margin:0 0 14px;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;background-color:#f8fafc;">
              <tr>
                <td class="stat-cell" style="padding:12px;text-align:center;border-right:1px solid #e2e8f0;">
                  <div class="stat-label" style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Rank</div>
                  <div class="stat-value" style="font-size:20px;font-weight:800;color:#0b0f19;margin-top:2px;">#${rank || "—"}</div>
                </td>
                <td class="stat-cell" style="padding:12px;text-align:center;border-right:1px solid #e2e8f0;">
                  <div class="stat-label" style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Upvotes</div>
                  <div class="stat-value" style="font-size:20px;font-weight:800;color:#0b0f19;margin-top:2px;">${upvotes}</div>
                </td>
                <td style="padding:12px;text-align:center;">
                  <div class="stat-label" style="font-size:11px;color:#64748b;font-weight:700;text-transform:uppercase;">Clicks</div>
                  <div class="stat-value" style="font-size:20px;font-weight:800;color:#0b0f19;margin-top:2px;">${clicks}</div>
                </td>
              </tr>
            </table>
            <p style="margin:0;">We'll keep you posted as you hit new upvote milestones and climb the leaderboard. Share your listing to get more eyes on ${escapeHtml(productName)}!</p>`,
          ctaLabel: `View ${productName} Live`,
          ctaUrl: productUrl,
        }),
        text: `Welcome to TopSAAS${firstName}!\n\nHere is how ${productName} is performing right now:\n- Rank: #${rank || "—"}\n- Upvotes: ${upvotes}\n- Clicks: ${clicks}\n\nView your listing: ${productUrl}`,
      };
    }

    case "welcome_user": {
      const firstName = data.firstName ? ` ${String(data.firstName)}` : "";
      return {
        subject: "Welcome to TopSAAS — launch your SaaS for free",
        html: wrapLayout({
          preheader: "Welcome to TopSAAS! Submit your SaaS or AI tool for free in under 2 minutes.",
          badge: "Welcome",
          tone: "blue",
          heading: `Welcome to TopSAAS${firstName}!`,
          bodyHtml: `<p style="margin:0 0 12px;">Thanks for joining the <strong>TopSAAS</strong> community—where founders, builders, and early adopters discover new SaaS and AI tools every week.</p>
            <p style="margin:0 0 12px;">We noticed you haven't submitted a product yet. If you're building something, you can launch it in our directory for <strong>free in under 2 minutes</strong> and start collecting upvotes, feedback, and direct traffic.</p>
            <p style="margin:0;">Have questions? Just hit reply—we read every message.</p>`,
          ctaLabel: "Launch Your SaaS Free",
          ctaUrl: `${SITE_URL}/submit`,
        }),
        text: `Welcome to TopSAAS${firstName}!\n\nWe noticed you haven't submitted a product yet. If you're building a SaaS or AI tool, you can launch it for free in under 2 minutes and start collecting upvotes and direct traffic.\n\nSubmit here: ${SITE_URL}/submit`,
      };
    }
  }
}

async function sendViaResendWithRetry(params: {
  apiKey: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
}): Promise<{ ok: boolean; id?: string; status: number; error?: string }> {
  const { apiKey, to, subject, html, text, idempotencyKey } = params;
  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (idempotencyKey) {
    headers["Idempotency-Key"] = idempotencyKey;
  }

  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers,
        body: JSON.stringify({
          from: DEFAULT_FROM,
          reply_to: DEFAULT_REPLY_TO,
          to: [to],
          subject,
          html,
          text,
        }),
      });

      const bodyText = await res.text();
      let parsed: Record<string, unknown> = {};
      try {
        parsed = JSON.parse(bodyText);
      } catch {
        // non-JSON response
      }

      if (res.ok) {
        return { ok: true, id: String(parsed.id || ""), status: res.status };
      }

      const retryable = res.status === 429 || res.status >= 500;
      if (!retryable || attempt === maxAttempts) {
        return {
          ok: false,
          status: res.status,
          error: String(parsed.message || bodyText || `HTTP ${res.status}`),
        };
      }

      const retryAfterSec = Number(res.headers.get("retry-after") || "0");
      const delayMs =
        retryAfterSec > 0 ? retryAfterSec * 1000 : 400 * Math.pow(2, attempt - 1);
      await new Promise((r) => setTimeout(r, delayMs));
    } catch (err) {
      if (attempt === maxAttempts) {
        return {
          ok: false,
          status: 500,
          error: (err as Error)?.message || "Network error calling Resend",
        };
      }
      await new Promise((r) => setTimeout(r, 400 * Math.pow(2, attempt - 1)));
    }
  }

  return { ok: false, status: 500, error: "Exhausted retry attempts" };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY") || "";
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: "RESEND_API_KEY secret is not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload = (await req.json()) as SendEmailPayload;
    const { type, to, data = {}, idempotencyKey } = payload;

    if (!type || !to || typeof to !== "string" || !to.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Valid 'type' and 'to' email are required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase =
      supabaseUrl && supabaseServiceKey
        ? createClient(supabaseUrl, supabaseServiceKey)
        : null;

    // Deduplicate via email_logs when an idempotencyKey is provided
    if (supabase && idempotencyKey) {
      const { data: existing } = await supabase
        .from("email_logs")
        .select("id, resend_email_id, status")
        .eq("idempotency_key", idempotencyKey)
        .maybeSingle();

      if (existing && existing.status === "sent") {
        return new Response(
          JSON.stringify({
            ok: true,
            skipped: true,
            id: existing.resend_email_id,
          }),
          {
            status: 200,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    const { subject, html, text } = buildEmailContent(type, data);
    const result = await sendViaResendWithRetry({
      apiKey: resendApiKey,
      to: to.trim(),
      subject,
      html,
      text,
      idempotencyKey,
    });

    if (supabase) {
      try {
        await supabase.from("email_logs").upsert(
          {
            idempotency_key: idempotencyKey || null,
            email_type: type,
            recipient: to.trim().toLowerCase(),
            subject,
            resend_email_id: result.id || null,
            status: result.ok ? "sent" : "failed",
            error: result.error || null,
            metadata: data,
          },
          { onConflict: "idempotency_key" }
        );
      } catch (logErr) {
        console.warn("Could not log to email_logs:", logErr);
      }
    }

    if (!result.ok) {
      console.error("Resend send failed:", result.status, result.error);
      return new Response(
        JSON.stringify({ error: result.error || "Failed to send email" }),
        {
          status: result.status >= 400 ? result.status : 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ ok: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("send-email error:", err);
    return new Response(
      JSON.stringify({ error: (err as Error)?.message || "Internal Server Error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

