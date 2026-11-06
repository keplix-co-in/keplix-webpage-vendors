# Graph Report - keplix-webpage-vendors  (2026-11-02)

## Corpus Check
- 163 files · ~80,217 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 645 nodes · 1862 edges · 35 communities (20 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `17e43bc1`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- usePortalHeader
- useToast
- Button.jsx
- sign-up/page.jsx
- messages/page.jsx
- InspectionSheet.jsx
- dependencies
- (portal)/layout.jsx
- AuthContext.jsx
- renderSocialCard
- reviews/page.jsx
- maintenance.js
- next.config.mjs
- keplix-webpage-vendors
- Confirmation.jsx
- route.js
- welcome/layout.js
- done/layout.js
- forgot-password/layout.js
- reset-password/layout.js
- sign-in/layout.js
- sign-up/layout.js
- otp/layout.js
- verified/layout.js
- dev/layout.js
- compilerOptions
- proxy.js
- AGENTS.md
- eslint.config.mjs
- postcss.config.mjs

## God Nodes (most connected - your core abstractions)
1. `usePortalHeader()` - 53 edges
2. `useToast()` - 45 edges
3. `useAuth()` - 42 edges
4. `validate()` - 41 edges
5. `Button()` - 32 edges
6. `formatMoney()` - 29 edges
7. `Card()` - 26 edges
8. `rules` - 21 edges
9. `useDraft()` - 19 edges
10. `BookingsPage()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `JobCompletedPage()` --calls--> `usePortalHeader()`  [EXTRACTED]
  keplix-webpage-vendors/app/(portal)/bookings/[id]/completed/page.jsx → keplix-webpage-vendors/app/(portal)/layout.jsx
- `BookingInspectionPage()` --calls--> `usePortalHeader()`  [EXTRACTED]
  keplix-webpage-vendors/app/(portal)/bookings/[id]/inspection/page.jsx → keplix-webpage-vendors/app/(portal)/layout.jsx
- `RejectionSentPage()` --calls--> `usePortalHeader()`  [EXTRACTED]
  keplix-webpage-vendors/app/(portal)/bookings/[id]/rejected/page.jsx → keplix-webpage-vendors/app/(portal)/layout.jsx
- `EarningsPage()` --indirect_call--> `toEarningRow()`  [INFERRED]
  keplix-webpage-vendors/app/(portal)/earnings/page.jsx → keplix-webpage-vendors/lib/entities.js
- `NewServicePage()` --calls--> `usePortalHeader()`  [EXTRACTED]
  keplix-webpage-vendors/app/(portal)/services/new/page.jsx → keplix-webpage-vendors/app/(portal)/layout.jsx

## Import Cycles
- None detected.

## Communities (35 total, 15 thin omitted)

### Community 0 - "usePortalHeader"
Cohesion: 0.08
Nodes (68): BookingDetailPage(), RejectOrderPage(), SCHEMA, BookingsPage(), buildDays(), WALK_IN_PARAMS, CLOSED_STATUSES, DashboardPage() (+60 more)

### Community 1 - "useToast"
Cohesion: 0.05
Nodes (72): ForgotPasswordPage(), SCHEMA, metadata, AddressEntryPage(), SCHEMA, DAYS, SetBreaksPage(), DocumentsUploadPage() (+64 more)

### Community 2 - "Button.jsx"
Cohesion: 0.07
Nodes (40): AuthError(), AppError(), metadata, OnboardingError(), PortalError(), EditServicePage(), SupportPage(), DAYS (+32 more)

### Community 3 - "sign-up/page.jsx"
Cohesion: 0.07
Nodes (38): authAPI, OtpStep(), ForgotPasswordOtpPage(), stepStore, useResendCountdown(), useStepValue(), ResetPasswordPage(), SCHEMA (+30 more)

### Community 4 - "messages/page.jsx"
Cohesion: 0.11
Nodes (34): Messages(), SCHEMA, SupportChatPage(), AlertSettings(), isSoundEnabled(), playAlertBeep(), setSoundEnabled(), stopAlertBeep() (+26 more)

### Community 5 - "InspectionSheet.jsx"
Cohesion: 0.19
Nodes (11): inspectionAPI, BookingInspectionPage(), WalkInInspection(), InspectionSheet(), COMPONENT_ICON, DEFAULT_STATUS, FALLBACK_ICON, iconFor() (+3 more)

### Community 6 - "dependencies"
Cohesion: 0.05
Nodes (38): axios, eslint, eslint-config-next, leaflet, lucide-react, next, dependencies, axios (+30 more)

### Community 7 - "(portal)/layout.jsx"
Cohesion: 0.07
Nodes (38): bookingsAPI, walkInsAPI, chatAPI, feedbackAPI, notificationsAPI, reviewsAPI, paymentsAPI, servicesAPI (+30 more)

### Community 8 - "AuthContext.jsx"
Cohesion: 0.15
Nodes (18): GROUPS, ScreenIndexPage(), TEST_ACCOUNTS, AuthContext, AuthProvider(), WHY: the query cache outlives the session. Without this, a second vendor, ROUTE_FOR_LANDING, withUserId() (+10 more)

### Community 9 - "renderSocialCard"
Cohesion: 0.14
Nodes (19): alt, contentType, Image(), size, alt, contentType, Image(), size (+11 more)

### Community 10 - "reviews/page.jsx"
Cohesion: 0.27
Nodes (9): ReviewsPage(), SCHEMA, Avatar(), StarRating(), initialsOf(), formatRating(), hasRating(), NO_RATING_LABEL (+1 more)

### Community 12 - "maintenance.js"
Cohesion: 0.12
Nodes (21): dmSans, metadata, Providers(), PUBLIC_ASSETS, robots(), sitemap(), MaintenanceGate(), ToastProvider() (+13 more)

### Community 13 - "next.config.mjs"
Cohesion: 0.20
Nodes (9): apiOrigins, csp, nextConfig, WHY: booking/vendor ids live in our URLs — send only the origin, WHY: camera=(self) because vendors photograph vehicles during, WHY: legacy backstop for CSP frame-ancestors — blocks clickjacking, WHY: report-only on purpose. The allow-list above is derived from, WHY: the portal handles vendor auth tokens and payout details; (+1 more)

### Community 14 - "keplix-webpage-vendors"
Cohesion: 0.29
Nodes (6): Deploying, How it is put together, keplix-webpage-vendors, Running it, Screen index (dev only), Things worth knowing before you change something

### Community 16 - "route.js"
Cohesion: 0.60
Nodes (4): clip(), pick(), POST(), WHY: the policy in next.config.mjs is report-only until real flows prove it

## Knowledge Gaps
- **121 isolated node(s):** `feedbackAPI`, `metadata`, `metadata`, `SCHEMA`, `metadata` (+116 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `Button.jsx` to `usePortalHeader`, `useToast`, `sign-up/page.jsx`, `InspectionSheet.jsx`, `reviews/page.jsx`, `maintenance.js`?**
  _High betweenness centrality (0.045) - this node is a cross-community bridge._
- **Why does `usePortalHeader()` connect `usePortalHeader` to `useToast`, `Button.jsx`, `messages/page.jsx`, `InspectionSheet.jsx`, `(portal)/layout.jsx`, `reviews/page.jsx`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `usePortalHeader` to `useToast`, `Button.jsx`, `sign-up/page.jsx`, `messages/page.jsx`, `(portal)/layout.jsx`, `AuthContext.jsx`?**
  _High betweenness centrality (0.031) - this node is a cross-community bridge._
- **What connects `feedbackAPI`, `metadata`, `metadata` to the rest of the system?**
  _121 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `usePortalHeader` be split into smaller, more focused modules?**
  _Cohesion score 0.07805399625768511 - nodes in this community are weakly interconnected._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.05146520146520146 - nodes in this community are weakly interconnected._
- **Should `Button.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06573426573426573 - nodes in this community are weakly interconnected._