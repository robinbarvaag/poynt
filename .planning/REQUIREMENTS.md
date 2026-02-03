# Requirements: Poynt

**Defined:** 2026-02-03
**Core Value:** Marketers get practical, actionable help — editorial content to learn from and AI tools that give personalized marketing advice based on their business context.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Membership & Access Control

- [ ] **MEMB-01**: User can purchase membership on poynt.no via Stripe (1, 3, 6, or 12 month billing periods)
- [ ] **MEMB-02**: Stripe webhook creates Better Auth account and sends magic link welcome email
- [ ] **MEMB-03**: User sees tiered access — community content visible to all members, AI tools locked behind premium tier
- [ ] **MEMB-04**: Community-tier user sees upgrade prompts with clear CTA when attempting to access AI tools
- [ ] **MEMB-05**: User can manage subscription via Stripe Customer Portal (upgrade, downgrade, cancel, update payment)
- [ ] **MEMB-06**: New member completes onboarding flow (account setup → welcome tutorial showing available features)
- [ ] **MEMB-07**: User can log in via social login (Google) or magic link — no password required
- [ ] **MEMB-08**: User session persists across browser sessions and multiple devices

### Community Content

- [ ] **CONT-01**: Admin can create/edit/publish editorial articles in Payload with rich text, media, categories
- [ ] **CONT-02**: Admin can save drafts and schedule publish dates for articles
- [ ] **CONT-03**: Member can browse articles by category (e.g., "LinkedIn Tips", "TikTok", "E-post")
- [ ] **CONT-04**: Member can search articles by keyword
- [ ] **CONT-05**: Article pages have responsive typography, table of contents for long articles, embedded media

### AI Tools Administration

- [ ] **AITL-01**: Admin can edit default system prompts for each AI tool via Payload
- [ ] **AITL-02**: Admin can create per-customer prompt overrides for specific members
- [ ] **AITL-03**: AI tools check user's membership tier before executing — premium only

### Localization

- [ ] **I18N-01**: All CMS content (articles, tool descriptions, pages) supports Norwegian + English via Payload localization
- [ ] **I18N-02**: All UI strings (buttons, labels, errors, navigation) available in Norwegian and English
- [ ] **I18N-03**: User can switch language via header toggle, preference persists across sessions

### Admin & Management

- [ ] **ADMN-01**: Custom Payload admin component showing all On Poynt members (from Better Auth/Drizzle DB)
- [ ] **ADMN-02**: Admin can view member details: email, tier, Stripe status, last login
- [ ] **ADMN-03**: Admin can change member's tier or deactivate membership from Payload admin

### Dynamic On Poynt

- [ ] **DYNM-01**: On Poynt navigation, tool descriptions, and page content come from Payload CMS (not hardcoded)
- [ ] **DYNM-02**: On Poynt branding (app name, logo, colors) configurable via Payload global

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Content Notifications

- **NOTF-01**: Member receives weekly email digest of new articles
- **NOTF-02**: Member sees in-app "new content" badges since last visit

### Advanced AI Admin

- **AADM-01**: Tool metadata fully managed in CMS (enable/disable, reorder, input field config)
- **AADM-02**: Prompt versioning with version history and diff view
- **AADM-03**: Prompt preview/test interface — test changes before deploying to members
- **AADM-04**: Usage limits per member (X AI requests per month by tier)
- **AADM-05**: AI cost monitoring dashboard showing total API spend

### Podcast-to-Content Tool

- **PODC-01**: Admin can upload podcast audio/video file
- **PODC-02**: System transcribes audio via OpenAI Whisper with Norwegian language support
- **PODC-03**: System generates blog post (400-600 words) from transcript via Claude
- **PODC-04**: System generates social media posts (LinkedIn, Twitter/X, Instagram) from transcript
- **PODC-05**: System extracts key topics, quotes, and chapter markers from transcript
- **PODC-06**: System suggests DALL-E image prompts for episode artwork
- **PODC-07**: Speaker diarization — identify who said what in multi-speaker episodes

### Extended Localization

- **LCXT-01**: Localized date, number, and currency formatting per locale
- **LCXT-02**: Social login beyond Google (Facebook, LinkedIn)

### Content-AI Integration

- **CAIN-01**: Articles link to related AI tools ("Read about LinkedIn? Generate your plan")
- **CAIN-02**: AI tool results suggest related editorial content
- **CAIN-03**: Tool chaining — output of one tool feeds into another

## Out of Scope

| Feature | Reason |
|---------|--------|
| User-generated content / forums | Editorial only — moderation overhead too high for v1 |
| Mobile native app | Web-first, responsive covers 95% of use cases |
| Custom AI models per customer | Shared prompts with per-customer overrides sufficient |
| Third-party integrations (CRM, scheduling) | Not core value, integration maintenance is high |
| Live chat / community messaging | Real-time infrastructure too complex, email support sufficient |
| Gamification (points, badges) | Doesn't fit professional audience |
| White-label / multi-tenant | Single brand platform, not the business model |
| Video courses / interactive learning | Resource-intensive production, text guides first |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| MEMB-01 | — | Pending |
| MEMB-02 | — | Pending |
| MEMB-03 | — | Pending |
| MEMB-04 | — | Pending |
| MEMB-05 | — | Pending |
| MEMB-06 | — | Pending |
| MEMB-07 | — | Pending |
| MEMB-08 | — | Pending |
| CONT-01 | — | Pending |
| CONT-02 | — | Pending |
| CONT-03 | — | Pending |
| CONT-04 | — | Pending |
| CONT-05 | — | Pending |
| AITL-01 | — | Pending |
| AITL-02 | — | Pending |
| AITL-03 | — | Pending |
| I18N-01 | — | Pending |
| I18N-02 | — | Pending |
| I18N-03 | — | Pending |
| ADMN-01 | — | Pending |
| ADMN-02 | — | Pending |
| ADMN-03 | — | Pending |
| DYNM-01 | — | Pending |
| DYNM-02 | — | Pending |

**Coverage:**
- v1 requirements: 24 total
- Mapped to phases: 0
- Unmapped: 24 ⚠️

---
*Requirements defined: 2026-02-03*
*Last updated: 2026-02-03 after initial definition*
