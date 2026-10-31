# Graph Report - keplix-webpage-vendors  (2026-10-31)

## Corpus Check
- 160 files · ~79,273 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 632 nodes · 1830 edges · 36 communities (21 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `69d1a2ff`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- (portal)/layout.jsx
- useToast
- Card.jsx
- sign-up/page.jsx
- messages/page.jsx
- usePortalHeader
- dependencies
- (portal)/documents/page.jsx
- AuthContext.jsx
- renderSocialCard
- RouteFallback.jsx
- ServiceForm.jsx
- app/layout.js
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
5. `Button()` - 31 edges
6. `formatMoney()` - 29 edges
7. `Card()` - 26 edges
8. `rules` - 21 edges
9. `useDraft()` - 19 edges
10. `BookingsPage()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `EarningsPage()` --indirect_call--> `toEarningRow()`  [INFERRED]
  keplix-webpage-vendors/app/(portal)/earnings/page.jsx → keplix-webpage-vendors/lib/entities.js
- `NewServicePage()` --calls--> `usePortalHeader()`  [EXTRACTED]
  keplix-webpage-vendors/app/(portal)/services/new/page.jsx → keplix-webpage-vendors/app/(portal)/layout.jsx
- `PortalLayout()` --indirect_call--> `toNotification()`  [INFERRED]
  keplix-webpage-vendors/app/(portal)/layout.jsx → keplix-webpage-vendors/lib/entities.js
- `ResetPasswordPage()` --calls--> `useStepValue()`  [EXTRACTED]
  keplix-webpage-vendors/app/(auth)/reset-password/page.jsx → keplix-webpage-vendors/app/(auth)/_lib/stepStore.js
- `AuthError()` --calls--> `logBoundaryError()`  [EXTRACTED]
  keplix-webpage-vendors/app/(auth)/error.js → keplix-webpage-vendors/components/shell/RouteFallback.jsx

## Import Cycles
- None detected.

## Communities (36 total, 15 thin omitted)

### Community 0 - "(portal)/layout.jsx"
Cohesion: 0.07
Nodes (71): bookingsAPI, inspectionAPI, walkInsAPI, BookingDetailPage(), RejectOrderPage(), SCHEMA, BookingsPage(), buildDays() (+63 more)

### Community 1 - "useToast"
Cohesion: 0.07
Nodes (59): ForgotPasswordPage(), SCHEMA, ResetPasswordPage(), metadata, AddressEntryPage(), SCHEMA, DAYS, SetBreaksPage() (+51 more)

### Community 2 - "Card.jsx"
Cohesion: 0.08
Nodes (37): CompletionForm(), draftKey(), SCHEMA, FIELDS, PHOTO_TYPES, ProfilePage(), SCHEMA, ReviewsPage() (+29 more)

### Community 3 - "sign-up/page.jsx"
Cohesion: 0.09
Nodes (28): authAPI, OtpStep(), ForgotPasswordOtpPage(), stepStore, useResendCountdown(), useStepValue(), SCHEMA, SignInForm() (+20 more)

### Community 4 - "messages/page.jsx"
Cohesion: 0.08
Nodes (45): chatAPI, feedbackAPI, notificationsAPI, reviewsAPI, Messages(), SCHEMA, LOOK, lookFor() (+37 more)

### Community 5 - "usePortalHeader"
Cohesion: 0.12
Nodes (19): JobCompletedPage(), BookingInspectionPage(), RejectionSentPage(), usePortalHeader(), SupportPage(), WalkInClosedPage(), WalkInInspection(), ConfirmationAction() (+11 more)

### Community 6 - "dependencies"
Cohesion: 0.05
Nodes (38): axios, eslint, eslint-config-next, leaflet, lucide-react, next, dependencies, axios (+30 more)

### Community 7 - "(portal)/documents/page.jsx"
Cohesion: 0.09
Nodes (23): paymentsAPI, servicesAPI, documentsAPI, vendorAPI, DOC_LABELS, docLabel(), DocumentsPage(), isVerified() (+15 more)

### Community 8 - "AuthContext.jsx"
Cohesion: 0.16
Nodes (21): GROUPS, ScreenIndexPage(), TEST_ACCOUNTS, AuthContext, AuthProvider(), WHY: the query cache outlives the session. Without this, a second vendor, ROUTE_FOR_LANDING, withUserId() (+13 more)

### Community 9 - "renderSocialCard"
Cohesion: 0.14
Nodes (19): alt, contentType, Image(), size, alt, contentType, Image(), size (+11 more)

### Community 10 - "RouteFallback.jsx"
Cohesion: 0.23
Nodes (10): AuthError(), AppError(), metadata, OnboardingError(), PortalError(), FullPageLoading(), FullPageState(), HomeButton() (+2 more)

### Community 11 - "ServiceForm.jsx"
Cohesion: 0.13
Nodes (15): EditServicePage(), NewServicePage(), CATEGORY_NAMES, SCHEMA, SEGMENT_IDS, ServiceForm(), Modal(), DURATION_MAP (+7 more)

### Community 12 - "app/layout.js"
Cohesion: 0.19
Nodes (11): dmSans, metadata, Providers(), PUBLIC_ASSETS, robots(), sitemap(), ToastProvider(), metadataBaseUrl() (+3 more)

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
- **119 isolated node(s):** `feedbackAPI`, `metadata`, `metadata`, `SCHEMA`, `metadata` (+114 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `usePortalHeader()` connect `usePortalHeader` to `(portal)/layout.jsx`, `useToast`, `Card.jsx`, `messages/page.jsx`, `(portal)/documents/page.jsx`, `ServiceForm.jsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `Button()` connect `Card.jsx` to `(portal)/layout.jsx`, `useToast`, `sign-up/page.jsx`, `usePortalHeader`, `(portal)/documents/page.jsx`, `RouteFallback.jsx`, `ServiceForm.jsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `(portal)/layout.jsx` to `useToast`, `Card.jsx`, `sign-up/page.jsx`, `messages/page.jsx`, `(portal)/documents/page.jsx`, `AuthContext.jsx`, `ServiceForm.jsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **What connects `feedbackAPI`, `metadata`, `metadata` to the rest of the system?**
  _119 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `(portal)/layout.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07381748686096512 - nodes in this community are weakly interconnected._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.06827309236947791 - nodes in this community are weakly interconnected._
- **Should `Card.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.08282828282828283 - nodes in this community are weakly interconnected._