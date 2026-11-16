# Roadmap & Execution Tracker: AI Search Positioning & Weekly Digest Email

> **Project Goal:** Update TopSAAS to visibly lead with **AI-Search / LLM Positioning (GEO/AEO)** across the site, and launch a **Weekly Top Launches Email** that dynamically fetches the exact number of products launched that week and converts unsubscribed founders to Pro.

---

## 📋 Status Dashboard

| Phase | Component | Status | Priority |
|---|---|:---:|:---:|
| **Phase 1** | Homepage Hero & Positioning Update (AI/LLM Discovery) | ⏳ Pending | High |
| **Phase 1** | Submit / Launch Page: AI Search & GEO Benefits Card | ⏳ Pending | High |
| **Phase 1** | Real-time Sync of Products to `/llms.txt` & `/products.json` | ⏳ Pending | High |
| **Phase 2** | Dynamic Query: Exact Count of Launched Products for Week | ⏳ Pending | Critical |
| **Phase 2** | Dynamic Query: Top 3 Winners with Upvotes & Stats | ⏳ Pending | Critical |
| **Phase 2** | Unsubscribed vs Subscribed Recipient Segmentation | ⏳ Pending | Critical |
| **Phase 2** | Responsive HTML Template with Pro Pitch & CTA | ⏳ Pending | Critical |
| **Phase 2** | Testing, Preview, and Monday Cron Trigger | ⏳ Pending | High |

---

## 🎯 Phase 1: AI Search & LLM Positioning (GEO / AEO)

*Before sending emails pitching AI indexing, the platform will clearly showcase the AI search benefits.*

### 1.1 Homepage Hero & Headline
- **Objective:** Reframe TopSAAS to highlight visibility for both humans and AI models.
- **Copy:**
  - **Badge above headline:** `✨ Built for Google, Perplexity & ChatGPT Search`
  - **H1:** *Find the best SaaS. Or get yours found.*
  - **Subhead:** *Get your startup in front of early adopters, Google, and AI models like ChatGPT, Claude, and Perplexity.*

### 1.2 Submit / Launch Page Value Stack (`SubmitPage.tsx`)
- In the Pro / Verified Launch checkout card, explicitly highlight:
  - 🤖 **AI-Search Grounding:** Fast-track addition to `/llms.txt`, `/ai-snapshot.json`, and Schema.org knowledge graph for LLM models (ChatGPT, Claude, Perplexity).
  - ⚡ **24-Hour Express Review:** Skip the standard review queue.
  - 🔗 **Permanent Dofollow Backlink:** Boost Domain Rating (DR) with search engines.
  - 🏆 **Priority Weekly Spotlight:** Placed directly into the upcoming weekly launch round.
*(Note: No mention of 25-app cap; no AI badge on product pages).*

---

## 📬 Phase 2: Weekly Top Launches Email Engine

*Send every Monday with exact live metrics and targeted conversion pitches.*

### 2.1 Dynamic Data Queries (`email-digest/index.ts`)
1. **Exact Product Count:**
   ```ts
   // Query exact number of products launched in the previous week
   const prevWeek = currentWeekNumber - 1;
   const { count: exactLaunchCount } = await supabase
     .from("products")
     .select("id", { count: "exact", head: true })
     .eq("scheduled_launch_week", prevWeek)
     .eq("is_sponsor_only", false);
   ```
2. **Top 3 Winners:**
   ```ts
   const { data: topWinners } = await supabase
     .from("products")
     .select("name, tagline, url, logo_url, upvotes, clicks, slug, category")
     .eq("scheduled_launch_week", prevWeek)
     .eq("is_sponsor_only", false)
     .order("upvotes", { ascending: false })
     .limit(3);
   ```
3. **Recipient Personal Status & Segmentation:**
   - Detect if recipient has a product live or in queue.
   - Detect `isSubscribed` flag (`verified === true` or active sponsor).
   - Unsubscribed founders receive the **Pro Offer Block**.
   - Subscribed founders receive leaderboard updates and sharing prompts.

### 2.2 Email Copy & Dynamic Content (`send-email/index.ts`)
- **Dynamic Intro:** *"{{exactLaunchCount}} products launched on TopSAAS last week. Here are the top 3 community favorites:"*
- **The Top 3 Podium:**
  - 🥇 #1 Winner (Logo, Title, Tagline, Category, Upvotes)
  - 🥈 #2 Winner
  - 🥉 #3 Winner
- **Recipient's Product Progress:**
  - Status box with current Rank, Upvotes, and Clicks.
- **The Targeted Pro Pitch (for Unsubscribed Users):**
  - **Headline:** *Want your product in front of next week's audience?*
  - **Value Stack:** 24h review, permanent dofollow backlink, `/llms.txt` AI-search indexing, priority weekly launch spotlight.
  - **CTA Button:** `Claim Next Week's Spotlight ($15) →`
*(Note: No mention of 25-app cap).*

---

## 🔄 Change Log & Progress Updates
- [x] Initialized tracking document
- [ ] Implement Phase 1: AI Search hero & submit page messaging
- [ ] Implement Phase 2: Dynamic weekly count & Top 3 query
- [ ] Implement Phase 2: Email HTML template with conditional Pro pitch
