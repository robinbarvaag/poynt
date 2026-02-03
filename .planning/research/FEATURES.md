# Features Research: Membership-Based Community + AI Tools Platform

**Research Date:** 2026-02-03
**Platform Type:** Membership portal with editorial community content + AI marketing tools
**Target Audience:** Marketers (Norwegian + English)
**Business Model:** Tiered subscriptions (community-only vs community + AI tools)

---

## Table Stakes: Membership & Access Control

These features are expected by users and critical for platform credibility. Missing any of these will cause user friction or abandonment.

### 1. Tiered Membership Access
**Complexity:** Medium
**Why Table Stakes:** Users expect clear boundaries between what's included in each tier.

- **Tier-based content gating** — Community tier sees editorial content; Premium tier sees editorial + AI tools
- **Visual tier indicators** — Badge/label showing user's current tier in UI
- **Upgrade prompts** — "This feature requires Premium" with clear upgrade CTA when users hit paywalls
- **Graceful tier enforcement** — Navigation shows locked features (grayed out/locked icon) rather than hiding them completely

**Dependencies:**
- User role system (already exists via Better Auth workspace roles)
- Stripe subscription management
- Auth unification (Payload + Better Auth)

---

### 2. Subscription Management
**Complexity:** Medium-High
**Why Table Stakes:** Users need self-service billing control or support costs skyrocket.

- **View current plan** — Dashboard showing tier, billing period, next renewal date
- **Upgrade/downgrade** — Self-service tier changes with prorated billing
- **Cancel subscription** — Clear cancellation flow (immediate vs end-of-period)
- **Billing history** — List of past invoices with download links
- **Payment method updates** — Change credit card without contacting support
- **Pause/resume** — Optional: pause membership for 1-3 months (competitive differentiator for some platforms)

**Dependencies:**
- Stripe Customer Portal (can handle most of this out-of-box)
- Webhook handling for subscription status changes
- Real-time access revocation when subscription expires

---

### 3. Onboarding Flow
**Complexity:** Medium
**Why Table Stakes:** Users who don't understand the platform in first session have high churn.

- **Post-purchase redirect** — Smooth transition from Stripe checkout → membership portal
- **Account linking** — Connect Stripe purchase to On Poynt account (critical path — see Auth Unification section)
- **Welcome tutorial** — Brief walkthrough of available features (tooltips or interactive guide)
- **Default workspace creation** — New users get a starter workspace automatically
- **Email confirmation** — "Welcome to On Poynt" email with login link and quick-start guide

**Dependencies:**
- Auth unification
- Stripe webhook → user provisioning flow
- Email templates (Resend already integrated)

---

### 4. Content Discovery
**Complexity:** Low-Medium
**Why Table Stakes:** Users can't get value from content they can't find.

- **Navigation structure** — Clear categories for community content (e.g., "LinkedIn Tips," "TikTok Strategy," "Email Marketing")
- **Search** — Full-text search across articles, guides, and tool descriptions
- **Filtering/sorting** — By topic, date, content type (article/guide/video)
- **Breadcrumbs** — Users know where they are in content hierarchy
- **Related content** — "You might also like" suggestions at bottom of articles
- **Recently added** — "New this week" section on dashboard

**Dependencies:**
- Payload CMS collections for community content
- Search indexing (Payload has built-in search)
- Taxonomy/category system

---

### 5. Session Management
**Complexity:** Low
**Why Table Stakes:** Users expect modern auth UX.

- **Persistent login** — "Remember me" via refresh tokens
- **Session expiry** — Auto-logout after inactivity (30 days standard)
- **Multiple devices** — Allow simultaneous logins (desktop + mobile)
- **Logout everywhere** — Security feature to revoke all sessions
- **Password reset** — Self-service password recovery via email

**Dependencies:**
- Better Auth (already supports this)
- Token refresh logic

---

## Table Stakes: Community Content Platform

### 6. Editorial Content Management
**Complexity:** Low-Medium
**Why Table Stakes:** Partner needs to publish content without developer involvement.

- **Rich text editor** — Format articles with headings, lists, bold/italic, links, images
- **Draft/publish workflow** — Save drafts, schedule publish dates
- **Media library** — Upload and organize images/PDFs/videos
- **SEO metadata** — Title, description, OG tags per article (even if gated)
- **Content versioning** — View history of changes (Payload has this)
- **Categories/tags** — Organize content by topic

**Dependencies:**
- Payload CMS (already has rich text, media, drafts)
- New collection: CommunityArticles or similar

---

### 7. Reading Experience
**Complexity:** Low
**Why Table Stakes:** Content needs to be pleasant to consume.

- **Responsive typography** — Readable on desktop and mobile
- **Table of contents** — For long-form articles (auto-generated from headings)
- **Reading progress indicator** — Scroll bar showing progress through article
- **Print/save functionality** — Export to PDF or print-friendly view
- **Code snippets** — Syntax highlighting if including technical content
- **Embedded media** — Videos, images, embeds (YouTube, Twitter, etc.)

**Dependencies:**
- Frontend rendering (React components)
- Payload rich text field configuration

---

### 8. Content Updates & Notifications
**Complexity:** Medium
**Why Table Stakes:** Users need to know when new content is available.

- **Email digest** — Weekly summary of new articles (opt-in)
- **In-app notifications** — Badge showing "3 new articles" since last visit
- **RSS feed** — Optional: For power users who want to follow via feed reader
- **Changelog** — "What's new" page showing recent additions

**Dependencies:**
- Email service (Resend already integrated)
- Notification system (simple: store last-seen timestamp, compare to article publish dates)

---

## Table Stakes: AI Tools Administration

### 9. Prompt Configuration System
**Complexity:** Medium-High
**Why Table Stakes:** Partner needs to tune AI outputs without editing code.

- **Default prompts** — Global prompts used for all customers unless overridden
- **System prompts** — Instruction sets that shape AI behavior (tone, format, constraints)
- **Per-customer overrides** — Admin can tweak prompts for specific customers (edge cases, special requests)
- **Prompt versioning** — Track changes to prompts over time
- **Preview/test interface** — Test prompt changes before deploying to customers
- **Rollback capability** — Revert to previous prompt version if changes cause issues

**Dependencies:**
- New Payload collection: Prompts (with fields for tool name, default text, system prompt, overrides)
- tRPC integration to fetch active prompt for user/tool combination
- Admin UI in Payload (custom components if needed)

---

### 10. AI Tool Access Control
**Complexity:** Low-Medium
**Why Table Stakes:** Premium tier users expect exclusive access to AI tools.

- **Tier-gated tools** — Community tier can't access AI tools at all
- **Usage limits** — Optional: Premium tier gets X requests/month (prevents abuse)
- **Rate limiting** — Prevent spam/abuse (e.g., max 10 requests/minute)
- **Error handling** — Graceful degradation when OpenAI API is down
- **Cost monitoring** — Admin dashboard showing total AI API spend

**Dependencies:**
- User tier detection (from Stripe subscription status)
- Middleware in tRPC to check tier before tool execution
- Usage tracking (simple counter in database)

---

### 11. Tool Configuration Management
**Complexity:** Medium
**Why Table Stakes:** Partner needs to update tool descriptions, help text, and parameters without code changes.

- **Tool metadata in CMS** — Name, description, icon, category stored in Payload
- **Input field configuration** — Define form fields (text, select, checkbox) via CMS
- **Help text/examples** — Contextual help for each tool input
- **Enable/disable tools** — Turn tools off without deploying code
- **Tool ordering** — Drag-and-drop to reorder tools in navigation

**Dependencies:**
- New Payload collection: Tools (with fields for name, description, enabled status, input schema)
- Frontend fetches tool config from CMS instead of hardcoded data

---

## Table Stakes: Localization

### 12. Norwegian + English Support
**Complexity:** Medium-High
**Why Table Stakes:** Norwegian market is primary, but English expands reach.

- **Language switcher** — Toggle between Norwegian/English in header
- **Persistent language preference** — Remember user's choice (localStorage or DB)
- **Translated UI strings** — All buttons, labels, error messages in both languages
- **Translated CMS content** — Articles, tool descriptions, pages in both languages
- **Localized formatting** — Dates, numbers, currency formatted per locale
- **Fallback strategy** — If translation missing, show Norwegian (primary language)

**Dependencies:**
- i18n library (next-intl is popular for Next.js App Router)
- Payload localization plugin
- Translation files (JSON or similar)

---

## Differentiators: Competitive Advantages

These features set the platform apart from generic membership/community tools.

### 13. Contextual AI Recommendations
**Complexity:** High
**Why Differentiating:** Generic AI tools give generic advice; contextual tools feel like a personal consultant.

- **User profile/industry** — AI tools reference user's industry, company size, goals
- **Previous tool usage** — AI remembers past inputs (e.g., marketing plan references earlier channel guide outputs)
- **Workspace context** — AI can reference workspace data (e.g., "Based on your Q1 plan...")
- **Learning from corrections** — If user edits AI output, system learns their preferences

**Dependencies:**
- User profile collection (industry, role, company info)
- Cross-tool data sharing (workspace-level context storage)
- Prompt injection with user-specific context

**Note:** This is partially implemented via existing workspace/industry system. Deepening it is the differentiator.

---

### 14. Norwegian Marketing Expertise
**Complexity:** Medium
**Why Differentiating:** Most AI marketing tools are US-centric; Norwegian-specific advice is rare.

- **Norwegian market insights** — AI prompts include knowledge of Norwegian platforms (e.g., Finn.no, VG, Aftenposten)
- **Cultural adaptation** — Tone, formality levels appropriate for Norwegian business culture
- **Local compliance** — GDPR, Markedsføringsloven (Marketing Act) considerations in outputs
- **Norwegian-language outputs** — AI can generate content in Norwegian (not just translate)

**Dependencies:**
- Custom system prompts with Norwegian market knowledge
- Partner's domain expertise encoded in prompts

---

### 15. Integrated Workflow
**Complexity:** Medium
**Why Differentiating:** Most platforms have tools in silos; this creates end-to-end workflows.

- **Tool chaining** — Output of one tool (e.g., marketing plan) feeds into another (e.g., yearly planner)
- **Saved templates** — Users save common tool configurations for reuse
- **Workflow suggestions** — "You used Channel Guide. Next step: Create a Marketing Plan."
- **Workspace-level projects** — Group tool outputs into campaigns/projects

**Dependencies:**
- Workspace data model (already exists)
- Cross-tool data passing mechanism
- Frontend UX for workflow guidance

---

### 16. Partner-Curated Editorial + AI Synergy
**Complexity:** Low-Medium
**Why Differentiating:** Combining human expertise (editorial) with AI personalization is rare.

- **Article → AI tool flow** — "Read about LinkedIn strategy? Generate your LinkedIn plan."
- **AI tool → related articles** — After AI generates output, suggest relevant guides
- **Editorial prompts** — Partner writes "AI tool of the week" spotlights in content
- **Feedback loop** — Partner sees which AI tools are used most, creates content around them

**Dependencies:**
- Metadata linking articles to tools (tags or relation fields)
- Analytics to track tool usage

---

## Anti-Features: Deliberately Excluded for V1

These are common features in similar platforms that should NOT be built initially to maintain focus and reduce complexity.

### 17. User-Generated Content / Forums
**Why Exclude:** Moderation overhead is massive. Editorial-only content keeps quality high and workload manageable.

**Might Add Later:** If community grows and moderation capacity exists.

---

### 18. Social Login (Google, Facebook, LinkedIn)
**Why Exclude:** Auth unification is already complex. Email/password + account linking is simpler for v1.

**Might Add Later:** Once core auth flow is stable.

---

### 19. Mobile Native App
**Why Exclude:** Web-first approach reduces platform fragmentation. Responsive web covers 95% of use cases.

**Might Add Later:** If mobile traffic dominates and PWA isn't sufficient.

---

### 20. Custom AI Models per Customer
**Why Exclude:** Out of scope per PROJECT.md. Shared prompts with per-customer overrides is sufficient for v1.

**Might Add Later:** Enterprise tier (future).

---

### 21. Third-Party Integrations (CRM, Analytics, Social Scheduling)
**Why Exclude:** Integration maintenance is high. Core value is content + AI tools, not being a hub.

**Might Add Later:** If specific integration requests become common.

---

### 22. Live Chat / Community Messaging
**Why Exclude:** Adds real-time infrastructure complexity. Email support is sufficient for v1.

**Might Add Later:** If community engagement becomes a priority.

---

### 23. Gamification (Points, Badges, Leaderboards)
**Why Exclude:** Professional audience doesn't need gamification. Could feel gimmicky.

**Might Add Later:** Unlikely — doesn't fit brand.

---

### 24. Video Courses / Interactive Learning
**Why Exclude:** Editorial content is text-based guides/articles. Video production is resource-intensive.

**Might Add Later:** If partner wants to expand into course creation.

---

### 25. White-Label / Multi-Tenant Platform
**Why Exclude:** This is a single-brand platform (Poynt). Multi-tenancy adds massive complexity.

**Never Add:** Not the business model.

---

## Feature Dependencies Map

This map shows critical dependencies between features that affect implementation sequencing.

```
Auth Unification (CRITICAL PATH)
├── Onboarding Flow (#3)
│   ├── Subscription Management (#2)
│   └── Session Management (#5)
├── Tiered Membership Access (#1)
│   └── AI Tool Access Control (#10)
└── Content Discovery (#4)

Payload CMS Content Collections (FOUNDATION)
├── Editorial Content Management (#6)
│   ├── Reading Experience (#7)
│   └── Content Updates & Notifications (#8)
├── Tool Configuration Management (#11)
│   └── Prompt Configuration System (#9)
└── Localization (#12)
    └── All UI features

Stripe Integration (EXISTING)
├── Subscription Management (#2)
└── Tiered Membership Access (#1)

Workspace System (EXISTING)
├── Contextual AI Recommendations (#13)
├── Integrated Workflow (#15)
└── AI Tool Access Control (#10)
```

---

## Complexity Summary

| Complexity Level | Features | Estimated Effort |
|------------------|----------|------------------|
| **Low** | Session Management (#5), Reading Experience (#7), Tool metadata in CMS (part of #11) | 1-3 days each |
| **Low-Medium** | Content Discovery (#4), Editorial Content Management (#6), AI Tool Access Control (#10), Partner-Curated Synergy (#16) | 3-5 days each |
| **Medium** | Tiered Membership Access (#1), Onboarding Flow (#3), Content Updates (#8), Tool Configuration Management (#11), Norwegian Expertise (#14), Integrated Workflow (#15) | 5-10 days each |
| **Medium-High** | Subscription Management (#2), Prompt Configuration System (#9), Localization (#12) | 10-15 days each |
| **High** | Contextual AI Recommendations (#13) | 15-20 days |

**Critical Path Features (Must complete first):**
1. Auth Unification (not in this list — separate infrastructure task)
2. Tiered Membership Access (#1)
3. Onboarding Flow (#3)
4. Subscription Management (#2)
5. Localization (#12) — affects all UI, so should be architectural decision early

---

## References & Inspiration

**Membership Platforms Analyzed (2024-2025 knowledge):**
- **Circle.so** — Community platform with tiered access, strong content gating UX
- **Kajabi** — Course + membership hybrid, excellent onboarding flows
- **Mighty Networks** — Community-first platform, good mobile UX
- **Ghost** — Newsletter + membership, clean reading experience
- **Memberstack** — Membership layer for websites, flexible tier configuration

**AI Tools Platforms Analyzed:**
- **Jasper.ai** — Marketing AI tools, template-based approach
- **Copy.ai** — Workflow-oriented AI tools, tool chaining
- **ChatGPT Plus** — Usage limits, prompt management patterns
- **Notion AI** — Contextual AI integrated into workspace

**Key Takeaways:**
1. **Stripe Customer Portal** is table stakes — don't build custom billing UI in v1
2. **Content gating UX** matters more than sophisticated permissions — clear tier boundaries with upgrade CTAs
3. **Onboarding tutorials** have highest ROI for retention (source: Appcues 2024 benchmarks)
4. **Localization** must be architectural from day 1 — retrofitting is painful
5. **Prompt management** needs versioning and testing UI — live editing without preview causes production issues

---

*Last updated: 2026-02-03*
