# Graph Report - keplix-webpage-vendors  (2026-11-07)

## Corpus Check
- 171 files · ~83,703 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 676 nodes · 1945 edges · 40 communities (24 shown, 16 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 13 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9f4a5eb6`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- (portal)/layout.jsx
- useToast
- RouteFallback.jsx
- Button.jsx
- messages/page.jsx
- InspectionSheet.jsx
- dependencies
- (portal)/documents/page.jsx
- AuthContext.jsx
- renderSocialCard
- reviews/page.jsx
- ServiceForm.jsx
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
- profile/page.jsx
- completed/page.jsx
- bucketJobs
- JobTimeline.jsx

## God Nodes (most connected - your core abstractions)
1. `usePortalHeader()` - 53 edges
2. `useToast()` - 45 edges
3. `useAuth()` - 42 edges
4. `validate()` - 41 edges
5. `Button()` - 33 edges
6. `formatMoney()` - 27 edges
7. `Card()` - 26 edges
8. `rules` - 21 edges
9. `useDraft()` - 19 edges
10. `BookingsPage()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `ForgotPasswordPage()` --calls--> `validate()`  [EXTRACTED]
  keplix-webpage-vendors/app/(auth)/forgot-password/page.jsx → keplix-webpage-vendors/shared/utils/validation.js
- `JobCompletedPage()` --calls--> `usePortalHeader()`  [EXTRACTED]
  keplix-webpage-vendors/app/(portal)/bookings/[id]/completed/page.jsx → keplix-webpage-vendors/app/(portal)/layout.jsx
- `BookingInspectionPage()` --calls--> `usePortalHeader()`  [EXTRACTED]
  keplix-webpage-vendors/app/(portal)/bookings/[id]/inspection/page.jsx → keplix-webpage-vendors/app/(portal)/layout.jsx
- `RejectionSentPage()` --calls--> `usePortalHeader()`  [EXTRACTED]
  keplix-webpage-vendors/app/(portal)/bookings/[id]/rejected/page.jsx → keplix-webpage-vendors/app/(portal)/layout.jsx
- `NewServicePage()` --calls--> `usePortalHeader()`  [EXTRACTED]
  keplix-webpage-vendors/app/(portal)/services/new/page.jsx → keplix-webpage-vendors/app/(portal)/layout.jsx

## Import Cycles
- None detected.

## Communities (40 total, 16 thin omitted)

### Community 0 - "(portal)/layout.jsx"
Cohesion: 0.06
Nodes (89): bookingsAPI, inspectionAPI, walkInsAPI, notificationsAPI, BookingDetailPage(), RejectOrderPage(), SCHEMA, BookingsPage() (+81 more)

### Community 1 - "useToast"
Cohesion: 0.08
Nodes (50): metadata, AddressEntryPage(), SCHEMA, DAYS, SetBreaksPage(), DocumentsUploadPage(), SCHEMA, OwnerDetailsPage() (+42 more)

### Community 2 - "RouteFallback.jsx"
Cohesion: 0.22
Nodes (10): AuthError(), AppError(), metadata, OnboardingError(), PortalError(), FullPageLoading(), FullPageState(), HomeButton() (+2 more)

### Community 3 - "Button.jsx"
Cohesion: 0.08
Nodes (38): authAPI, OtpStep(), ForgotPasswordOtpPage(), ForgotPasswordPage(), SCHEMA, stepStore, useResendCountdown(), useStepValue() (+30 more)

### Community 4 - "messages/page.jsx"
Cohesion: 0.10
Nodes (34): Messages(), SCHEMA, AlertSettings(), PortalHeader(), Avatar(), Select(), Toggle(), isSoundEnabled() (+26 more)

### Community 5 - "InspectionSheet.jsx"
Cohesion: 0.21
Nodes (10): BookingInspectionPage(), WalkInInspection(), InspectionSheet(), COMPONENT_ICON, DEFAULT_STATUS, FALLBACK_ICON, iconFor(), MAX_PHOTOS_PER_ITEM (+2 more)

### Community 6 - "dependencies"
Cohesion: 0.05
Nodes (40): axios, eslint, eslint-config-next, leaflet, lucide-react, next, dependencies, axios (+32 more)

### Community 7 - "(portal)/documents/page.jsx"
Cohesion: 0.11
Nodes (31): documentsAPI, vendorAPI, DOC_LABELS, docLabel(), DocumentsPage(), isVerified(), LOCKED_TYPES, SCHEMA (+23 more)

### Community 8 - "AuthContext.jsx"
Cohesion: 0.07
Nodes (39): ok(), syncSession(), withHeldMirror(), paymentsAPI, servicesAPI, GROUPS, ScreenIndexPage(), TEST_ACCOUNTS (+31 more)

### Community 9 - "renderSocialCard"
Cohesion: 0.14
Nodes (19): alt, contentType, Image(), size, alt, contentType, Image(), size (+11 more)

### Community 10 - "reviews/page.jsx"
Cohesion: 0.24
Nodes (10): chatAPI, reviewsAPI, ReviewsPage(), SCHEMA, StarRating(), unwrap(), formatRating(), hasRating() (+2 more)

### Community 11 - "ServiceForm.jsx"
Cohesion: 0.18
Nodes (11): NewServicePage(), CATEGORY_NAMES, SCHEMA, SEGMENT_IDS, ServiceForm(), Modal(), DURATION_MAP, durationLabelFor() (+3 more)

### Community 12 - "maintenance.js"
Cohesion: 0.12
Nodes (21): dmSans, metadata, Providers(), PUBLIC_ASSETS, robots(), sitemap(), MaintenanceGate(), ToastProvider() (+13 more)

### Community 13 - "next.config.mjs"
Cohesion: 0.20
Nodes (9): apiOrigins, csp, nextConfig, WHY: booking/vendor ids live in our URLs — send only the origin, WHY: camera=(self) because vendors photograph vehicles during, WHY: legacy backstop for CSP frame-ancestors — blocks clickjacking, WHY: report-only on purpose. The allow-list above is derived from, WHY: the portal handles vendor auth tokens and payout details; (+1 more)

### Community 14 - "keplix-webpage-vendors"
Cohesion: 0.25
Nodes (7): Deploying, How it is put together, keplix-webpage-vendors, Maintenance mode, Running it, Screen index (dev only), Things worth knowing before you change something

### Community 16 - "route.js"
Cohesion: 0.60
Nodes (4): clip(), pick(), POST(), WHY: the policy in next.config.mjs is report-only until real flows prove it

### Community 36 - "profile/page.jsx"
Cohesion: 0.26
Nodes (13): FIELDS, PHOTO_TYPES, ProfilePage(), SCHEMA, DEFAULT_CENTER, MapPicker(), toAddress(), ADDRESS_FIELDS (+5 more)

### Community 37 - "completed/page.jsx"
Cohesion: 0.33
Nodes (6): JobCompletedPage(), RejectionSentPage(), WalkInClosedPage(), ConfirmationAction(), ConfirmationPanel(), TONES

### Community 38 - "bucketJobs"
Cohesion: 0.52
Nodes (5): bucketJobs(), isOngoingStatus(), getJobDurationMinutes(), getJobStartedAt(), isJobOverdue()

## Knowledge Gaps
- **127 isolated node(s):** `metadata`, `metadata`, `SCHEMA`, `metadata`, `metadata` (+122 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **16 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `Button.jsx` to `(portal)/layout.jsx`, `useToast`, `RouteFallback.jsx`, `profile/page.jsx`, `InspectionSheet.jsx`, `(portal)/documents/page.jsx`, `reviews/page.jsx`, `ServiceForm.jsx`, `maintenance.js`?**
  _High betweenness centrality (0.042) - this node is a cross-community bridge._
- **Why does `usePortalHeader()` connect `(portal)/layout.jsx` to `useToast`, `messages/page.jsx`, `InspectionSheet.jsx`, `completed/page.jsx`, `(portal)/documents/page.jsx`, `profile/page.jsx`, `reviews/page.jsx`, `ServiceForm.jsx`?**
  _High betweenness centrality (0.038) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `(portal)/layout.jsx` to `useToast`, `Button.jsx`, `messages/page.jsx`, `profile/page.jsx`, `(portal)/documents/page.jsx`, `AuthContext.jsx`, `ServiceForm.jsx`?**
  _High betweenness centrality (0.032) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `SCHEMA` to the rest of the system?**
  _127 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `(portal)/layout.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.0634453781512605 - nodes in this community are weakly interconnected._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.07942097026604068 - nodes in this community are weakly interconnected._
- **Should `Button.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.07643600180913614 - nodes in this community are weakly interconnected._