# Graph Report - keplix-webpage-vendors  (2026-11-21)

## Corpus Check
- 184 files · ~92,645 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 756 nodes · 2157 edges · 44 communities (29 shown, 15 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 18 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `ea69bea7`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useToast
- DraftProvider.jsx
- Button.jsx
- sign-up/page.jsx
- messages/page.jsx
- (portal)/layout.jsx
- dependencies
- (portal)/documents/page.jsx
- AuthContext.jsx
- renderSocialCard
- servicePricing.js
- hooks.mjs
- Toast.jsx
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
- Field.jsx
- validate
- mockSupabase.mjs
- mockApi.mjs
- workshop/page.jsx
- onboarding/services/page.jsx
- (onboarding)/layout.jsx

## God Nodes (most connected - your core abstractions)
1. `usePortalHeader()` - 53 edges
2. `useToast()` - 45 edges
3. `useAuth()` - 42 edges
4. `validate()` - 41 edges
5. `Button()` - 36 edges
6. `formatMoney()` - 29 edges
7. `Card()` - 26 edges
8. `rules` - 21 edges
9. `useDraft()` - 19 edges
10. `BookingsPage()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `EarningsPage()` --indirect_call--> `toEarningRow()`  [INFERRED]
  keplix-webpage-vendors/app/(portal)/earnings/page.jsx → keplix-webpage-vendors/lib/entities.js
- `PortalLayout()` --indirect_call--> `toNotification()`  [INFERRED]
  keplix-webpage-vendors/app/(portal)/layout.jsx → keplix-webpage-vendors/lib/entities.js
- `SignUpOtpPage()` --calls--> `useStepValue()`  [EXTRACTED]
  keplix-webpage-vendors/app/(auth)/sign-up/otp/page.jsx → keplix-webpage-vendors/app/(auth)/_lib/stepStore.js
- `AuthError()` --calls--> `logBoundaryError()`  [EXTRACTED]
  keplix-webpage-vendors/app/(auth)/error.js → keplix-webpage-vendors/components/shell/RouteFallback.jsx
- `ForgotPasswordPage()` --calls--> `validate()`  [EXTRACTED]
  keplix-webpage-vendors/app/(auth)/forgot-password/page.jsx → keplix-webpage-vendors/shared/utils/validation.js

## Import Cycles
- None detected.

## Communities (44 total, 15 thin omitted)

### Community 0 - "useToast"
Cohesion: 0.06
Nodes (79): bookingsAPI, inspectionAPI, walkInsAPI, servicesAPI, ServiceSetupPage(), BookingDetailPage(), RejectOrderPage(), SCHEMA (+71 more)

### Community 1 - "DraftProvider.jsx"
Cohesion: 0.16
Nodes (21): AddressEntryPage(), SCHEMA, DAYS, SetBreaksPage(), DocumentsUploadPage(), SCHEMA, OnboardingHubPage(), STEPS (+13 more)

### Community 2 - "Button.jsx"
Cohesion: 0.07
Nodes (37): AuthError(), AppError(), metadata, OnboardingError(), CHECKLIST, CompletionForm(), draftKey(), SCHEMA (+29 more)

### Community 3 - "sign-up/page.jsx"
Cohesion: 0.14
Nodes (19): SCHEMA, SignInForm(), SCHEMA, SignUpPage(), POINTS, STEPS, WelcomePage(), EntryRouter() (+11 more)

### Community 4 - "messages/page.jsx"
Cohesion: 0.11
Nodes (24): chatAPI, notificationsAPI, reviewsAPI, Messages(), SCHEMA, LOOK, lookFor(), NotificationsPage() (+16 more)

### Community 5 - "(portal)/layout.jsx"
Cohesion: 0.10
Nodes (24): JobCompletedPage(), BookingInspectionPage(), RejectionSentPage(), HeaderContext, usePortalHeader(), EditServicePage(), NewServicePage(), SupportPage() (+16 more)

### Community 6 - "dependencies"
Cohesion: 0.05
Nodes (40): axios, eslint, eslint-config-next, leaflet, lucide-react, next, dependencies, axios (+32 more)

### Community 7 - "(portal)/documents/page.jsx"
Cohesion: 0.12
Nodes (26): documentsAPI, vendorAPI, DOC_LABELS, docLabel(), DocumentsPage(), isVerified(), LOCKED_TYPES, SCHEMA (+18 more)

### Community 8 - "AuthContext.jsx"
Cohesion: 0.07
Nodes (39): authAPI, ok(), syncSession(), withHeldMirror(), paymentsAPI, SignUpOtpPage(), GROUPS, ScreenIndexPage() (+31 more)

### Community 9 - "renderSocialCard"
Cohesion: 0.14
Nodes (19): alt, contentType, Image(), size, alt, contentType, Image(), size (+11 more)

### Community 10 - "servicePricing.js"
Cohesion: 0.08
Nodes (52): buildServiceForm(), ChipsField(), cell(), LineRow(), money(), PriceLinesSection(), PricingSection(), CATEGORY_NAMES (+44 more)

### Community 11 - "hooks.mjs"
Cohesion: 0.20
Nodes (5): here, MAP, root, storage, store

### Community 12 - "Toast.jsx"
Cohesion: 0.11
Nodes (23): dmSans, metadata, Providers(), PUBLIC_ASSETS, robots(), sitemap(), MaintenanceGate(), ToastContext (+15 more)

### Community 13 - "next.config.mjs"
Cohesion: 0.18
Nodes (10): apiOrigins, csp, nextConfig, WHY: the portal handles vendor auth tokens and payout details;, WHY: vendor-uploaded files are served/proxied by the app; stop, WHY: booking/vendor ids live in our URLs — send only the origin, WHY: camera=(self) because vendors photograph vehicles during, WHY: legacy backstop for CSP frame-ancestors — blocks clickjacking (+2 more)

### Community 14 - "keplix-webpage-vendors"
Cohesion: 0.25
Nodes (7): Deploying, How it is put together, keplix-webpage-vendors, Maintenance mode, Running it, Screen index (dev only), Things worth knowing before you change something

### Community 16 - "route.js"
Cohesion: 0.60
Nodes (4): clip(), pick(), POST(), WHY: the policy in next.config.mjs is report-only until real flows prove it

### Community 36 - "profile/page.jsx"
Cohesion: 0.24
Nodes (14): FIELDS, PHOTO_TYPES, ProfilePage(), SCHEMA, DEFAULT_CENTER, MapPicker(), toAddress(), ADDRESS_FIELDS (+6 more)

### Community 37 - "Field.jsx"
Cohesion: 0.17
Nodes (22): AlertSettings(), PortalHeader(), Avatar(), Select(), Toggle(), isSoundEnabled(), playAlertBeep(), setSoundEnabled() (+14 more)

### Community 38 - "validate"
Cohesion: 0.20
Nodes (15): OtpStep(), ForgotPasswordOtpPage(), ForgotPasswordPage(), SCHEMA, stepStore, useResendCountdown(), useStepValue(), ResetPasswordPage() (+7 more)

### Community 39 - "mockSupabase.mjs"
Cohesion: 0.22
Nodes (5): calls, handlers, holdLog, NAMES, supabase

### Community 40 - "mockApi.mjs"
Cohesion: 0.50
Nodes (3): api, apiCalls, apiHandlers

### Community 41 - "workshop/page.jsx"
Cohesion: 0.23
Nodes (12): OwnerDetailsPage(), SCHEMA, ADDRESS_REQUIRED, SCHEMA, WorkshopInfoPage(), PhotoGrid(), PhotoTile(), PhotoWell() (+4 more)

### Community 42 - "onboarding/services/page.jsx"
Cohesion: 0.29
Nodes (5): ChooseServiceForm(), DURATIONS, NO_SEGMENTS, SCHEMA, Input()

### Community 43 - "(onboarding)/layout.jsx"
Cohesion: 0.40
Nodes (3): metadata, merge(), OnboardingDraftProvider()

## Knowledge Gaps
- **144 isolated node(s):** `metadata`, `metadata`, `SCHEMA`, `metadata`, `metadata` (+139 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **15 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Button()` connect `Button.jsx` to `useToast`, `DraftProvider.jsx`, `sign-up/page.jsx`, `profile/page.jsx`, `(portal)/layout.jsx`, `validate`, `(portal)/documents/page.jsx`, `servicePricing.js`, `Toast.jsx`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `usePortalHeader()` connect `(portal)/layout.jsx` to `useToast`, `Button.jsx`, `messages/page.jsx`, `profile/page.jsx`, `(portal)/documents/page.jsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `useToast` to `DraftProvider.jsx`, `Button.jsx`, `sign-up/page.jsx`, `messages/page.jsx`, `(portal)/layout.jsx`, `profile/page.jsx`, `(portal)/documents/page.jsx`, `AuthContext.jsx`, `servicePricing.js`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `metadata`, `metadata`, `SCHEMA` to the rest of the system?**
  _144 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useToast` be split into smaller, more focused modules?**
  _Cohesion score 0.06361185983827493 - nodes in this community are weakly interconnected._
- **Should `Button.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.06885245901639345 - nodes in this community are weakly interconnected._
- **Should `sign-up/page.jsx` be split into smaller, more focused modules?**
  _Cohesion score 0.13911290322580644 - nodes in this community are weakly interconnected._