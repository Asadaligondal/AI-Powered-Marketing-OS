# AI Marketing OS — Weekend MVP Spec

> **Master context document.** Read this fully before writing any code. Every phase prompt references this file. If you're unsure about a decision, the answer is in here.

---

## 0. Two distinct AI roles (don't confuse them)

- **Claude Code (the builder):** runs on the user's Claude Pro plan. Used to write, edit, and refactor the codebase. No API key needed. This is YOU reading this doc.
- **OpenAI (the runtime AI):** powers the deployed app's intelligence — content generation, brand reasoning, DM parsing, embeddings. Called via the OpenAI SDK from server routes. Requires `OPENAI_API_KEY`.

The product is built by Claude Code but RUNS on OpenAI. Never call Anthropic from app code.

---

## 1. Vision (one paragraph)

Build a unified AI marketing operating system for a single founder-led brand. The product replaces the fragmented stack (separate tools for content, scheduling, DMs, leads, email) with one umbrella where an AI brand brain understands the business, then powers content generation, cross-platform repurposing, scheduling, lead capture, and CRM handoff. This is a pitch demo for a prospective long-term client — it must feel like a real product, not a prototype, even where features are intentionally mocked.

## 2. Audience for the demo

The viewer is **Liya**, a wellness/longevity entrepreneur evaluating whether to hire the builder long-term. She wants to see:

1. The system *understands* a brand (not generic AI slop)
2. One input → many platform-specific outputs (the "umbrella" feeling)
3. A working calendar she can imagine her own content sitting in
4. A lead-capture loop that closes (DM → lead → CRM → email triggered)

She does NOT need: real Instagram posting, AI video generation, influencer discovery. These are explicitly out of scope for the demo.

## 3. Demo brand: "Deskbound"

The MVP is built around a fictional brand so we don't burn Liya's real assets on a prototype. **All seed data, generated content, and copy must be consistent with this brand context.**

- **Name:** Deskbound
- **Tagline:** "Move better. Sit less. Think clearer."
- **Category:** Mobility & posture for desk workers / knowledge workers
- **Products:**
  1. *The 10-Minute Mobility Reset* (digital course, $49)
  2. *Deskbound Field Manual* (book/PDF, $19)
  3. *Live monthly mobility workshops* (Zoom, $29/session)
- **Voice:** Direct, warm, slightly nerdy. Cites mechanics ("hip flexor lengthening," "thoracic extension") without being clinical. No hype. Sparing exclamation marks. Anti-wellness-influencer.
- **Audience:** 28–45, knowledge workers, mild back/neck pain, sit 6+ hrs/day, skeptical of fluff, like Andrew Huberman / Peter Attia content
- **Content pillars:** (1) micro-mobility drills, (2) the science of why sitting wrecks you, (3) workspace setup, (4) habit stacking, (5) myth-busting wellness BS
- **Pain points addressed:** lower back pain, tight hips, brain fog from poor circulation, expensive useless ergonomic gear
- **Adjacent voices:** GMB Fitness, Knees Over Toes Guy, The Ready State

Seed this profile as the default brand on first run.

## 4. Tech stack

- **Framework:** Next.js 14 (App Router) + TypeScript
- **Styling:** Tailwind CSS + shadcn/ui (install via `npx shadcn@latest init`)
- **DB / Auth / Storage:** Supabase (Postgres with `pgvector`, Supabase Auth, Supabase Storage)
- **Runtime AI:** OpenAI SDK (`openai` npm package)
  - Default model: **`gpt-5.4-mini`** — content generation, brand reasoning, repurposing
  - Cheap/fast: **`gpt-5.4-nano`** — DM parsing, keyword extraction, simple classification
  - Heavy reasoning (only if needed): **`gpt-5.4`** — initial brand brain synthesis from docs
  - Embeddings: **`text-embedding-3-small`** (1536 dim)
- **Real integrations (must work end-to-end):**
  - Klaviyo (Track API for lead events; sandbox account)
  - LinkedIn (UGC Posts API; OAuth 2.0)
- **Mocked integrations (UX must feel real):** Instagram, TikTok, ManyChat webhooks
- **Scheduling:** Vercel Cron (one cron route polling for due posts)
- **Deploy:** Vercel
- **Auth strategy for demo:** Single hardcoded demo user, pre-seeded email/password. No signup flow.

## 5. Folder structure

```
/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (app)/
│   │   ├── layout.tsx                  # Sidebar shell, requires auth
│   │   ├── dashboard/page.tsx          # Overview: brand summary, today's posts, recent leads
│   │   ├── brand/page.tsx              # Brand Brain editor + doc upload
│   │   ├── content/
│   │   │   ├── page.tsx                # Generate from topic, see outputs
│   │   │   └── [batchId]/page.tsx      # Batch detail (all platforms for one idea)
│   │   ├── calendar/page.tsx           # Month view, drag/drop, generate-30-days
│   │   └── leads/page.tsx              # Leads table + simulate-DM tool
│   ├── api/
│   │   ├── brand/                      # CRUD + embed
│   │   ├── content/generate/route.ts   # POST { topic } → batch of platform outputs
│   │   ├── content/schedule/route.ts
│   │   ├── content/publish/route.ts    # Real for LinkedIn, mocked for others
│   │   ├── webhooks/dm/route.ts        # Simulated IG DM webhook
│   │   ├── klaviyo/sync/route.ts
│   │   ├── linkedin/auth/route.ts      # OAuth callback
│   │   └── cron/publish-due/route.ts   # Vercel Cron entry
│   └── layout.tsx
├── components/
│   ├── ui/                             # shadcn primitives
│   ├── brand/                          # BrandBrainForm, DocUploader
│   ├── content/                        # ContentCard, GenerateForm, PlatformBadge
│   ├── calendar/                       # MonthGrid, ScheduleSlot
│   └── leads/                          # LeadsTable, SimulateDMDialog
├── lib/
│   ├── supabase/{server,client,admin}.ts
│   ├── openai.ts                       # SDK wrapper + model constants
│   ├── prompts/                        # Versioned prompt templates per platform
│   ├── klaviyo.ts
│   ├── linkedin.ts
│   └── types.ts
├── supabase/
│   ├── migrations/                     # SQL migrations
│   └── seed.sql                        # Deskbound brand seed
├── .env.local.example
└── PROJECT_SPEC.md                     # This file
```

## 6. Database schema

All tables in `public`. Run `create extension if not exists vector;` first. **Embedding dim is 1536** to match `text-embedding-3-small`.

```sql
-- BRANDS
create table brands (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  name text not null,
  tagline text,
  description text,
  voice text,
  audience text,
  products jsonb default '[]'::jsonb,
  content_pillars jsonb default '[]'::jsonb,
  pain_points jsonb default '[]'::jsonb,
  competitors jsonb default '[]'::jsonb,
  embedding vector(1536),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- BRAND DOCUMENTS (RAG corpus: book chapters, course outlines, past posts)
create table brand_documents (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  title text,
  source_type text,                    -- 'upload' | 'pasted' | 'url'
  raw_content text,
  created_at timestamptz default now()
);

create table brand_document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid references brand_documents(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  chunk_index int,
  content text,
  embedding vector(1536),
  created_at timestamptz default now()
);

create index on brand_document_chunks using ivfflat (embedding vector_cosine_ops);

-- CONTENT
create type platform as enum (
  'instagram_post', 'instagram_reel', 'tiktok', 'linkedin', 'instagram_story'
);
create type content_status as enum (
  'draft', 'scheduled', 'publishing', 'published', 'failed'
);

create table content_batches (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  topic text not null,
  rationale text,                      -- AI's reasoning for why this fits the brand
  created_at timestamptz default now()
);

create table content_pieces (
  id uuid primary key default gen_random_uuid(),
  batch_id uuid references content_batches(id) on delete cascade,
  brand_id uuid references brands(id) on delete cascade,
  platform platform not null,
  hook text,
  body text,
  metadata jsonb default '{}'::jsonb,  -- {hashtags, cta, storyboard_beats, hook_score}
  status content_status default 'draft',
  scheduled_for timestamptz,
  published_at timestamptz,
  external_id text,
  publish_error text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index on content_pieces (brand_id, scheduled_for);
create index on content_pieces (status);

-- LEADS
create table leads (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  source text,                         -- 'instagram_dm' | 'manual' | 'comment'
  keyword text,                        -- e.g. 'MOBILITY', 'RESET'
  name text,
  email text,
  raw_message text,
  extracted_interests jsonb default '[]'::jsonb,
  klaviyo_profile_id text,
  klaviyo_synced_at timestamptz,
  created_at timestamptz default now()
);

-- PLATFORM CONNECTIONS (OAuth tokens)
create table platform_connections (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id) on delete cascade,
  platform text not null,              -- 'linkedin' | 'instagram' (mocked) | 'tiktok' (mocked)
  access_token text,
  refresh_token text,
  expires_at timestamptz,
  external_account_id text,
  account_handle text,
  is_mocked boolean default false,
  connected_at timestamptz default now()
);

-- ACTIVITY LOG (for the demo Loom — shows the system "thinking")
create table activity_log (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid references brands(id),
  action text,                         -- 'content_generated', 'lead_captured', 'post_published'
  details jsonb,
  created_at timestamptz default now()
);
```

RLS: enable on all tables, simple policy `using (brand_id in (select id from brands where user_id = auth.uid()))`. For single-demo-user this is enough.

## 7. Environment variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI (the only LLM provider for the app)
OPENAI_API_KEY=

# Klaviyo (sandbox)
KLAVIYO_PRIVATE_API_KEY=
KLAVIYO_PUBLIC_API_KEY=
KLAVIYO_LIST_ID=                       # Welcome list to subscribe leads to

# LinkedIn
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
LINKEDIN_REDIRECT_URI=                 # http://localhost:3000/api/linkedin/auth on dev

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
DEMO_USER_EMAIL=demo@deskbound.test
DEMO_USER_PASSWORD=                    # set on seed
CRON_SECRET=                           # to protect /api/cron/*
```

## 8. OpenAI usage patterns

`lib/openai.ts` — single wrapper, used everywhere:

```ts
import OpenAI from "openai";

export const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const MODELS = {
  default: "gpt-5.4-mini",        // content gen, repurposing
  cheap:   "gpt-5.4-nano",        // DM parsing, classification
  heavy:   "gpt-5.4",             // initial brand synthesis from large docs
  embed:   "text-embedding-3-small",
} as const;

export async function embed(text: string): Promise<number[]> {
  const r = await openai.embeddings.create({
    model: MODELS.embed,
    input: text,
  });
  return r.data[0].embedding;
}
```

**Use the Chat Completions API** (`openai.chat.completions.create`) for text gen — universally supported, well-documented. Always request JSON via `response_format: { type: "json_object" }` when you need structured output. Always pass a system prompt that includes the brand context (loaded from DB).

**Prompt template pattern:** keep all prompts in `lib/prompts/` as exported strings or template functions. One file per use case (`brandSynthesis.ts`, `contentBatch.ts`, `dmExtract.ts`). Never inline long prompts in route handlers.

**Brand context injection:** every content-generation call must inject the brand's voice + audience + pillars + pain points into the system message. This is what makes the output feel "on-brand" instead of generic AI slop. The Brand Brain isn't decorative — it's the prompt prefix for everything.

## 9. Phases & acceptance criteria

Build in this order. Each phase ends with something clickable. Don't move forward until the previous phase passes its checks.

### Phase 1 — Foundation & Brand Brain (Friday night, ~4–5h)

**Build:**
- Next.js project, Tailwind, shadcn init, Supabase project
- Run migrations + seed Deskbound brand
- Login page (pre-seeded user, email/password)
- App shell with sidebar (Dashboard, Brand, Content, Calendar, Leads)
- `/brand` page: editable form for brand fields + paste/upload doc → chunk + embed → store
- Server route `POST /api/brand/synthesize` — takes a paste/uploaded doc, calls `gpt-5.4` to extract structured brand fields, returns suggested updates the user can accept

**Acceptance:**
- [ ] You can log in
- [ ] `/brand` shows Deskbound details, fully editable, persists on save
- [ ] Pasting a sample doc on the brand page generates structured field suggestions
- [ ] Embeddings are stored in `brand_document_chunks`
- [ ] Sidebar nav works on every page

### Phase 2 — Content Engine (Saturday AM, ~5–6h)

**Build:**
- `/content` page with a "What's the topic?" input
- `POST /api/content/generate` — given topic, loads brand context, retrieves top-3 relevant doc chunks via embedding similarity, calls `gpt-5.4-mini` once to produce a JSON object containing: rationale, then 5 platform-specific pieces (IG post, IG Reel script, TikTok script, LinkedIn post, IG Story)
- Each piece has: hook, body, metadata (hashtags, CTA, storyboard beats for video pieces, hook_score 0–100 explained briefly)
- Render each piece as a card with platform badge, copy button, regenerate-this-one button, "schedule" button
- Save the batch + pieces to DB

**Acceptance:**
- [ ] Type "morning mobility routine" → 5 platform-specific pieces in <25s
- [ ] Outputs reference Deskbound's voice (mechanics-aware, anti-fluff) — not generic
- [ ] Each piece has a hook score with one-line explanation
- [ ] Regenerate works on a single piece without redoing the others
- [ ] Batch is browsable at `/content/[batchId]`

### Phase 3 — Calendar & Scheduling (Saturday PM, ~4–5h)

**Build:**
- `/calendar` page: month grid, each day shows scheduled pieces as small chips colored by platform
- "Generate 30 days" button → calls a route that picks 30 topics from brand pillars, calls `gpt-5.4-mini` in batches (5 days at a time to stay under tokens), creates content_batches + content_pieces, schedules them with sensible default times per platform (e.g., LinkedIn at 9am, IG Reels at 6pm)
- Drag-drop a piece to a different day (HTML5 drag or `@dnd-kit/core`)
- Click a chip → drawer with full content, edit-in-place, "publish now" button
- LinkedIn OAuth flow: connect button on calendar page → OAuth → token stored
- `POST /api/content/publish` → if LinkedIn and connected, real publish via UGC Posts API; else mark as published with `is_mocked` flag set in metadata, animate the publish state (pending → publishing → published) over 1.5s for the demo
- Vercel Cron (`/api/cron/publish-due`) hits every 5 minutes, picks up scheduled pieces whose time has passed, calls publish

**Acceptance:**
- [ ] "Generate 30 days" populates calendar with varied content across pillars
- [ ] Drag-drop reschedules and persists
- [ ] LinkedIn connect → real post lands on your test LinkedIn account
- [ ] Mocked Instagram/TikTok publish animates and ends in published state
- [ ] Cron route is wired (test by setting a piece to 1 min in the future and waiting)

### Phase 4 — Lead Capture & Klaviyo (Sunday AM, ~4h)

**Build:**
- `/leads` page: leads table, "Simulate Instagram DM" button opens dialog
- Dialog: textarea for fake DM body, optional "from" handle, send button
- `POST /api/webhooks/dm`: accepts the simulated DM (later, real IG webhook would hit same endpoint), calls `gpt-5.4-nano` with prompt to extract `{keyword, intent, name?, email?, interests[]}` from the message
- If keyword matches a configured trigger (e.g., "RESET", "MOBILITY"), create lead row, push to Klaviyo via `lib/klaviyo.ts` (`POST /api/profile-import` or Track API event), subscribe to list, log activity
- Show in the leads table in real-time (or refresh after send)
- Add a small "automation rules" panel on the page: list of `keyword → list_id → welcome_message` triplets (just static for the demo, can be hardcoded array)

**Acceptance:**
- [ ] Sending "Hey, can you DM me the MOBILITY guide? My email is test@x.com" creates a lead within 3s
- [ ] Lead appears in Klaviyo dashboard (verify in Klaviyo UI)
- [ ] Klaviyo welcome flow triggers (if configured) — at minimum, the profile import API returns 200
- [ ] Activity log shows the chain: webhook received → AI parsed → lead created → Klaviyo synced

### Phase 5 — Polish, Deploy, Loom (Sunday PM, ~3–4h)

**Build:**
- Dashboard page: brand summary card, "scheduled today" list, "recent leads" list, "system activity" feed (last 10 activity_log rows)
- Empty states everywhere (no awkward blanks)
- Loading skeletons on async pages
- Toast notifications on key actions (shadcn `toast`)
- Fix the 5 worst rough edges
- Deploy to Vercel, set env vars, run migration on prod Supabase
- Record a 4–6 minute Loom: brand brain → content gen → calendar populate → drag-drop reschedule → simulate DM → lead lands in Klaviyo → done

**Acceptance:**
- [ ] Live URL works for Liya without any setup
- [ ] Demo user creds work
- [ ] No console errors on the main flows
- [ ] Loom recorded and uploaded

## 10. Mock-vs-real cheat sheet

| Feature | Real | Mocked |
|---|---|---|
| Brand brain & content gen | ✅ OpenAI calls | — |
| Embeddings & RAG | ✅ Supabase pgvector | — |
| LinkedIn publish | ✅ UGC Posts API | — |
| Klaviyo lead sync | ✅ Track / Profile Import API | — |
| Vercel Cron scheduling | ✅ | — |
| Instagram publish | — | ✅ Animated state machine, `is_mocked: true` flag |
| TikTok publish | — | ✅ Same as IG |
| Instagram DM webhook | — | ✅ "Simulate DM" dialog hits the same internal endpoint a real webhook would |
| ManyChat integration | — | ✅ The `/api/webhooks/dm` route IS the ManyChat-equivalent |
| Influencer engine | — | ❌ Out of scope, mention as "Phase 2" |
| Video generation | — | ❌ Out of scope |
| Tribe V2 | — | ❌ Out of scope (use internal hook_score heuristic) |

## 11. Design system (Linear / Vercel-style clean SaaS)

**Color (dark mode primary):**
- Background: `#0A0A0A` base, `#111111` cards, `#1A1A1A` elevated
- Border: `#222222` subtle, `#2A2A2A` interactive
- Text: `#F5F5F5` primary, `#A3A3A3` secondary, `#737373` tertiary
- Accent: a single restrained accent — `#3B82F6` (blue) or `#10B981` (emerald). Pick one and stick with it.
- Status: green = published, amber = scheduled, gray = draft, red = failed

**Typography:**
- Sans: `Inter` (Google Fonts) for everything, with `font-feature-settings: "cv11", "ss01"` for the Linear/Vercel look
- Display sizes only on dashboard/marketing surfaces — interior pages stay 14–16px

**Layout:**
- Sidebar: 240px fixed, dark, icon + label per item
- Main: max-width 1200px on most pages, full-width on calendar
- Cards: `rounded-lg border border-[#222] bg-[#111] p-5`
- Spacing: stick to Tailwind's 4px scale, prefer `gap-*` + flex/grid over margin

**Motion:**
- All transitions 150ms ease-out
- Publish state changes use a brief progress shimmer
- Nothing bounces, nothing wiggles — restraint is the brand

**shadcn components to install up front:**
`button card input textarea label select dialog drawer dropdown-menu toast badge tabs separator avatar skeleton table calendar` (some via `npx shadcn@latest add <name>`)

**Don't:**
- Don't use gradients except very subtly (radial dim on hero card, max)
- Don't use emojis in the UI chrome (icons only — use `lucide-react`)
- Don't use rounded-full pills everywhere — keep `rounded-md` / `rounded-lg`

> **Superseded by Linear.md design system applied 2026-05-10.** Use `Linear.md` in the repo root as the visual source of truth for colors, typography, spacing, and motion; this subsection remains as historical context only.

## 12. What sells the demo (priorities for polish)

In order of impact on Liya's gut reaction:

1. **The first content generation feeling magical** — when she types a topic and 5 on-brand pieces appear with hook scores, that's the "oh shit" moment. Spend extra time on prompt quality for Phase 2.
2. **The calendar feeling alive** — populated with 30 days of varied content, color-coded, draggable. This is the "wait, I can run my whole month from here?" moment.
3. **The DM → lead → Klaviyo loop closing in real time** — show the activity log updating live. This is the "the tools actually talk to each other" moment.
4. **Brand brain that actually learned something** — paste in a doc, watch it suggest structured updates. This is the "it gets my business" moment.

If you're running short on time, sacrifice in this order: drag-drop polish → calendar themes → activity log animations → mocked TikTok → mocked Instagram. Never sacrifice content quality, brand voice match, or the Klaviyo-real-call.

## 13. Operating principles for Claude Code

- **Don't yak-shave.** If something is taking >30 min, ship the simpler version and move on.
- **Don't refactor proactively.** Ship the phase. Refactor only when blocked.
- **Don't skip the seed.** A populated DB sells the demo; an empty one breaks it.
- **Don't write tests this weekend.** Manual verification per phase only. (Yes, really.)
- **Don't add features not in this spec.** "Wouldn't it be cool if…" is how weekends die.
- **Do commit at the end of every phase** with a clear message.
- **Do log every AI call** to console with model + token usage. We need to know what's costing what.
- **Do verify each phase's acceptance checks before moving on.** The user is verifying along the way.
