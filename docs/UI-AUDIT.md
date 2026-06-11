# Commun-It-Is — UI/UX Audit & Remediation Plan

> **Audit date:** 2026-06-08
> **Auditor:** Claude (ui-ux-pro-max skill)
> **App version reviewed:** main branch + production at https://commun-it-is.vercel.app/

---

## Background

A Hebrew (RTL) community app delivered as a React PWA and wrapped with Capacitor for the Android store. Target users are residents of small communities. The app currently covers: feed of community posts, ride sharing (publish + public board), phonebook, notifications history, settings, and a committee dashboard.

**Platform target:** **Phone is the primary platform.** Desktop is a supported secondary platform — the app must remain comfortable and functional with a mouse on a wide screen, not just survive the resize. Every finding below should be evaluated with both contexts in mind. When a fix has different implications per platform, the Acceptance clause says so explicitly.

**Stack reviewed:** React 19 · Vite · Tailwind 3 · shadcn-style UI primitives (Button, Input, Card, Label) · Radix · Lucide · Framer Motion · Supabase JS · Capacitor 8 (web → Android wrapper, no native UI).

**Methodology:**
1. Full source read of all `src/Pages/**` and `src/Components/**` files.
2. **Visual checks are performed via Windows-MCP** — take control of the Windows desktop, open the production URL (or local dev server) in a browser, and capture real renders at the working viewport. Do not rely on code reading alone for anything that has visual or interactive consequences.
3. Live walkthrough of every reachable route with a real authenticated session, on phone and desktop viewports.
4. JS-injected measurements of computed styles, touch-target sizes, focus-visible behavior, and WCAG contrast ratios on the rendered DOM.
5. Visual inspection of key flows: login, register, home feed, sidebar drawer, create-post modal, rides board, send-ride form, phonebook, settings (including the toggle), notifications, committee dashboard.

**Reference frameworks:** WCAG 2.1 AA (+ 2.5.8 target size for desktop) · Apple HIG (touch targets, motion, safe areas) · Material Design 3 (state layers, motion, typography roles, adaptive navigation).

---

## How to Use This Plan

- Each finding is **outcome-driven**: it states what is wrong and what "fixed" looks like, but **not** how to implement it. The implementer chooses the approach.
- Work top-down by phase. **Do not skip Phase 1.** Phases 2–3 assume Phase 1 has landed (some Phase 1 fixes touch shared primitives that cascade through later items).
- Tick the box only when the **Acceptance** clause is satisfied — not when the change is merely written.
- If a finding turns out to be invalid in context, leave the box unchecked and add a `~~strikethrough~~` note explaining why.
- New findings discovered during fixes go at the bottom under "Discovered During Remediation".

---

## Strengths — What Already Works Well

Preserve these patterns when refactoring:

- `env(safe-area-inset-top/bottom)` is correctly used in `MainLayout.jsx` for notch/home-indicator clearance.
- Route-level lazy loading via `React.lazy` in `App.jsx` keeps the initial bundle small.
- `Suspense` fallback (`PageLoader`) is consistent and on-brand.
- Supabase Realtime channel in `ResidentVerificationPending` produces a "live approval" UX without polling.
- Framer Motion `layout` + `spring` on `RideCard` gives the rides board a natural feel.
- Semantic time-bucket coloring in rides (red = departed, amber = imminent, teal = future) is a strong information design choice.
- Official 4-color Google brand SVG is used correctly in `GoogleSignInButton` (no recolored or simplified variant).
- `dir="rtl"` and `lang="he"` correctly set at the HTML root.
- Lucide is the canonical icon set throughout — no mixed icon families.
- Destructive emphasis (red Logout in the sidebar, red Danger Zone block in Settings) follows convention.

---

## Findings

ID convention: `F##` numbered globally across phases. Where a finding was confirmed on the live app (not just by reading code), the `Issue` line says **"Confirmed live."**

---

### Phase 1 — Critical (Day-1 blockers, must clear before next release)

#### [x] F1. Mobile zoom is disabled app-wide
- **Where:** `index.html` — viewport meta tag
- **Issue:** `maximum-scale=1.0, user-scalable=no` blocks the OS pinch-to-zoom. Violates WCAG 1.4.4 (Resize Text). Hits exactly the older / low-vision residents this app targets.
- **Acceptance:** On a real phone, two-finger pinch on any screen zooms the UI. Lighthouse mobile a11y audit no longer flags the viewport. Layout does not break when zoomed.

#### [x] F2. Primary CTA color fails WCAG AA contrast
- **Where:** Every primary teal button in the app (Login, Register, Settings save, Send ride, Refresh status, etc.).
- **Issue:** **Confirmed live.** Measured `teal-600` background with white text = 3.74:1. WCAG AA requires 4.5:1 for normal text.
- **Acceptance:** The primary action color passes 4.5:1 against its text color on every screen. Verified with a contrast tool, not by eye.

#### [x] F3. Touch targets below 44pt across most interactive elements
- **Where:** Sidebar items, all `<Button size="default">` and `<Input>` (h-9 = 36px), header Menu/Close icons, in-card icon buttons, Google sign-in.
- **Issue:** **Confirmed live.** Measured 9 of 15 interactive elements on Home page below the 44×44pt iOS minimum. Sidebar items "דף הבית", "ספר טלפונים", "הודעות חשובות" all 239×36. The shadcn defaults shipped here are desktop-tuned.
- **Acceptance:** On phone widths or touch input, every tappable element measures ≥44×44pt (iOS HIG) / 48×48dp (Material). On desktop with mouse input, targets may be more compact but never below WCAG 2.5.8 (24×24 CSS px) and must keep comfortable density. The mobile baseline is never undermined by desktop styling. Spot-checked at both breakpoints across all routes.

#### [x] F4. No visible keyboard focus state on primary CTAs
- **Where:** Raw `<button>` elements in `LoginPage`, `RegisterPage`, `OnboardingPage`, `ResidentVerificationPending`, `GoogleSignInButton`, `PhoneBook` search, `CreatePostModal` controls.
- **Issue:** **Confirmed live.** Submitted focus to the Login submit button — computed `outline: none`, `box-shadow: none`. Keyboard / screen-reader users have no indication of focus position.
- **Acceptance:** Tabbing through any page produces a clearly visible focus ring (contrasting, ≥2px) on every focusable element. Verified by keyboard-only tab tour of every route.

#### [x] F5. Icon-only buttons missing accessibility labels
- **Where:** Header Menu (MainLayout), Sidebar close X, FAB "+" on Home, Trash on image preview (CreatePostModal), Share2 in FeedPosts, X in RideDetailsModal.
- **Issue:** Screen readers announce "button" with no purpose for any of them.
- **Acceptance:** VoiceOver / TalkBack announces a meaningful Hebrew label for every icon-only control. Verified with a real screen reader, not just by inspecting attributes.

#### [ ] F6. Sidebar does not close after navigation
- **Where:** `src/Components/mainlayoutComp/Sidebar.jsx` — `handleNavigation`.
- **Issue:** ~~**Invalid in context 2026-06-11** — already fixed in an earlier commit (the in-file Hebrew comment near `handleNavigation` documents the previous bug where `closeSidebar;` was an expression instead of a call). Live verification on localhost confirmed all 4 nav items close the drawer in the same gesture they navigate (`closedAfterNav: true` for every route tested). No code change needed.~~ **Confirmed live.** After tapping a nav item the drawer stays open over the new page. Caused by a function reference that is never invoked. Several nav items also bypass the helper and call `navigate` directly, so they would still leak even after the helper is fixed.
- **Acceptance:** Tapping any sidebar item navigates to the target route **and** closes the drawer in the same gesture. Verified across all nav items, including the nested "טרמפיקציה" children.

#### [ ] F7. Active-route highlighting in sidebar is broken for all items
- **Where:** `Sidebar.jsx` — `isActive(...)` calls.
- **Issue:** ~~**Invalid in context 2026-06-11** — already fixed in an earlier commit. Each nav button now passes its own path (`/`, `/rides`, `/send-ride`, `/phonebook`, `/notifications`, `/settings`) to `isActive`. Live verification confirmed every route highlights its own item: 4 items use `text-teal-400` and Settings intentionally uses `bg-slate-800 text-white` for a distinct treatment (it lives in the footer block). Both patterns are detectable visually as "you are here".~~ **Confirmed live.** All items pass `'/send-ride'` to `isActive`, so only that one route ever appears active. Confirmed on Home: zero items reported `looksActive: true`.
- **Acceptance:** Each sidebar item visually reflects "I am here" when its route is current — verified by visiting each route in turn and watching the highlight follow.

#### [x] F8. Broken avatar leaks alt text into the feed
- **Where:** `FeedPosts.jsx` — `<img src={post.users?.avatar_url}>`.
- **Issue:** **Confirmed live.** When `avatar_url` is empty/null the browser renders the alt text "User Avatar" inside the broken image box. Every post by a user without an uploaded avatar looks broken.
- **Acceptance:** A post by a user with no avatar shows a clean fallback (e.g., initial in a colored circle) consistent with the avatar fallback already used in PhoneBook. No alt text is ever visible to the end user.

#### [x] F9. Phonebook search field is invisible on its background
- **Where:** `PhoneBook.jsx` — search input styling.
- **Issue:** **Confirmed live.** `bg-slate-800` on `bg-slate-900` produces ~1.34:1 separation; the input is undiscoverable until a user happens to tap on the empty strip and the placeholder appears.
- **Acceptance:** The search field is clearly visible as an input at first glance on the empty PhoneBook screen (and remains visible when the list has results). Tested on light- and dark-mode displays at typical phone brightness.

---

### Phase 2 — Important (correctness & UX integrity)

#### [ ] F10. Mixed `<input>` / `<Input>` usage produces inconsistent focus and autofill behavior
- **Where:** LoginPage, RegisterPage, OnboardingPage, PhoneBook, ResidentVerificationPending, CommunitiesList use raw `<input>`; Settings (ProfileForm) and SendRide (RideForm) use the shadcn `<Input>` primitive.
- **Issue:** ~~**Partial 2026-06-12** — LoginPage and RegisterPage raw `<input>` elements now visually + interactively match the shadcn `<Input>` primitive (same `h-11 md:h-9`, `text-base md:text-sm`, `rounded-md`, `--ring` focus, slate-800 offset). The full migration of every remaining raw `<input>` (OnboardingPage, PhoneBook, ResidentVerificationPending, CommunitiesList) is deferred — it touches every form in the app and is best done as a dedicated refactor.~~ Two parallel design systems for the most common form control. Focus rings, placeholder colors, padding scale, and autofill rules all differ subtly between screens.
- **Acceptance:** Every text field in the app shares one component (or two, with documented purposes). Visual + interaction parity across all forms.

#### [x] F11. Form fields rely on placeholders instead of labels (RegisterPage + LoginPage)
- **Where:** `LoginPage.jsx`, `RegisterPage.jsx` email/password fields.
- **Issue:** Once typing starts there is no on-screen hint of the field's purpose. Screen readers receive no label association.
- **Acceptance:** Every input has a visible label above the field, properly associated (clicking the label focuses the input). Placeholders, if present, are examples — not labels.

#### [x] F12. Icon position on inputs flips between pages
- **Where:** LoginPage (right), RegisterPage (left), OnboardingPage (right).
- **Issue:** Inconsistent leading affordance across the auth flow. In an RTL layout, the leading edge is the right side.
- **Acceptance:** All input-prefix icons sit on the same side throughout the app, matching the language direction.

#### [x] F13. CreatePostModal: backdrop click does not dismiss; no Escape handler
- **Where:** `CreatePostModal.jsx`.
- **Issue:** **Confirmed live.** Clicking the dark overlay does nothing. No keyboard support to dismiss. Existing close affordance is only the X.
- **Acceptance:** Modal closes on backdrop click and on Escape key, but never on a click inside the modal body. Unsaved content prompts before discarding.

#### [x] F14. CreatePostModal: footer row is visually unbalanced and order swaps when toggle hides
- **Where:** `CreatePostModal.jsx` — the `flex justify-between` action row.
- **Issue:** **Confirmed live.** Toggle ("פרסם כהודעת ועד") sits in a large amber-tinted card on one side; the Publish button is small on the other. Visual weight is wildly uneven. For non-committee users the toggle is absent and the Publish button drifts to a different position.
- **Acceptance:** Action bar has a single clear primary CTA, with the committee toggle treated as a secondary control (e.g., above the CTA). Layout is stable whether the user is a committee member or not.

#### [x] F15. Settings toggle is invisible to assistive tech
- **Where:** `ProfileForm.jsx` — phonebook visibility toggle. Same pattern in `CreatePostModal.jsx`.
- **Issue:** **Confirmed live.** Element has no `role="switch"`, no `aria-checked`. Screen readers cannot identify it as a switch or report its state.
- **Acceptance:** Toggle announces correctly as a switch with current on/off state. Operable with Space/Enter when focused. Looks and behaves consistently in both places.

#### [x] F16. Native `alert()` / `confirm()` used for in-app feedback
- **Where:** HomePage, SendRide, OnboardingPage, SettingsPage (Danger Zone), PhoneBook, FeedPosts.
- **Issue:** ~~**Invalid in context 2026-06-12** — already resolved in commits `ac88d00` (sonner toasts) and the introduction of `src/Components/ui/confirm-dialog.jsx`. A repo-wide grep for `alert(`/`confirm(` in `src/` returns only comments referencing the old behavior; no live calls remain. SettingsPage's Danger Zone delete is already routed through `ConfirmDialog`.~~ Inside the Capacitor Android wrapper these render as system dialogs with English-only "OK" / "Cancel" buttons that break the Hebrew flow and feel like the app crashed.
- **Acceptance:** No `alert` or `confirm` call remains in user-reachable paths. Feedback uses an in-app toast or inline message; destructive confirmations use a properly designed dialog.

#### [x] F17. Destructive account deletion confirms with a single Yes/No prompt
- **Where:** `SettingsPage.jsx` — `handleHardReset`.
- **Issue:** Permanent account deletion is one click + one dismissable prompt away. No friction for an irreversible action.
- **Acceptance:** Deletion requires explicit confirmation that cannot be triggered by muscle memory (e.g., type-to-confirm, or two-step dialog). Outcome and irreversibility are clearly stated.

#### [x] F18. Onboarding "Logout" button submits the form
- **Where:** `OnboardingPage.jsx` — the logout `<button>` near the bottom.
- **Issue:** Inside a `<form>` without `type="button"`, the button defaults to `type="submit"` and triggers form submission instead of logout.
- **Acceptance:** Tapping logout from the Onboarding screen signs the user out and does not submit the profile form.

#### [x] F19. Pulsing primary CTA on email verification screen
- **Where:** `VerificationEmailSent.jsx` — `animate-pulse` on the main button.
- **Issue:** Pulsing animation on an interactive element is distracting, ignores `prefers-reduced-motion`, and undermines users with vestibular sensitivity.
- **Acceptance:** The button no longer pulses. Attention is drawn through stable visual hierarchy (size, weight, color). Respects reduced-motion globally.

#### [x] F20. `<input type="text">` used for numeric fields
- **Where:** `RideForm.jsx` — "מספר מושבים" (seats).
- **Issue:** Mobile keyboard opens as alphabetic instead of numeric. Slows entry and invites typos.
- **Acceptance:** Numeric and tel fields trigger the correct system keyboard on iOS and Android, with sane min/max where applicable.

#### [x] F21. Phone field "ltr" class is a no-op
- **Where:** `ProfileForm.jsx` phone input.
- **Issue:** `className="... ltr"` — Tailwind has no `ltr` utility. The intended direction override never applies.
- **Acceptance:** Phone numbers display and type left-to-right regardless of page direction; verified on a Hebrew device.

#### [x] F22. Community search dropdown does not close on outside click
- **Where:** `CommunitiesList.jsx`.
- **Issue:** Companion `CitySelect` has outside-click handling; `CommunitiesList` doesn't. Dropdown stays open while user interacts elsewhere on the form.
- **Acceptance:** Tapping anywhere outside the dropdown closes it. Behavior matches `CitySelect` on the same page.

#### [x] F23. `prefers-reduced-motion` is not respected anywhere
- **Where:** App-wide. All Framer Motion animations, `animate-pulse`, `animate-spin`, modal/page transitions.
- **Issue:** Users who have requested reduced motion at the OS level still see all entrance animations, pulses, and large transitions.
- **Acceptance:** With OS reduced motion enabled, non-essential motion is removed or replaced with crossfade/instant transitions. Verified with the OS toggle on.

#### [x] F24. Locked page scroll breaks mobile gestures
- **Where:** `src/index.css` — `html, body, #root { overflow: hidden }`.
- **Issue:** Disables iOS overscroll bounce and pull-to-refresh, can interact poorly with safe-area handling, and creates double-scroll edge cases when content overflows in odd ways.
- **Acceptance:** Page-level scroll uses standard layout (single primary scroll container with proper safe-area padding) without locking the document. Mobile bounce, pull-to-refresh, and address-bar shrink behave as users expect.

#### [x] F25. Layout uses `100vh` units that misbehave on iOS Safari
- **Where:** `App.jsx` page loaders, `LoginPage`, `RegisterPage`, `OnboardingPage`, `ResidentVerificationPending`, `MainLayout` (`h-screen`).
- **Issue:** Address-bar collapse causes layout jumps and content cut at the bottom on iOS Safari.
- **Acceptance:** Full-height containers use modern dynamic viewport units (`dvh`/`svh`) or equivalent. No content disappears behind the URL bar or home indicator on iOS.

#### [x] F26. Onboarding inputs may trigger iOS auto-zoom
- **Where:** `OnboardingPage.jsx` — `text-sm` inputs (14px effective font size).
- **Issue:** iOS Safari zooms any input with computed font-size < 16px when focused, breaking the layout.
- **Acceptance:** All inputs render at ≥16px on mobile widths. Focusing an input on iOS Safari does not zoom the page.

#### [x] F27. RideCard time display does not tick
- **Where:** `RideCard.jsx`.
- **Issue:** Parent `PublicDisplay` updates `currentTime` every second, but `RideCard` calls `formatRideTime` without that input, so the "leaves in N minutes" text stays stale until the rides list refetches.
- **Acceptance:** Time-until-departure text on each ride card updates in real time without requiring a refetch.

#### [x] F28. Page backgrounds fight the layout gradient
- **Where:** `PhoneBook.jsx`, `NotificationsHistory.jsx` — `bg-slate-900` on the page root.
- **Issue:** MainLayout already paints a teal-to-slate gradient on `<main>`. Inner pages overwrite it with flat slate-900, so the visual identity disappears the moment you leave Home.
- **Acceptance:** All authenticated pages share the same background treatment from the layout. Page components do not set their own background unless intentionally creating a distinct surface.

---

#### Desktop adaptation (newly relevant since the platform shift)

The following four findings became important the moment desktop became a supported platform rather than an accidental side-effect. They are Phase 2 because they affect usability, not just polish — at desktop widths the app currently feels like a phone preview pinned in the middle of the screen.

#### [ ] F44. App has no responsive layout adaptation
- **Where:** App-wide. Production code uses essentially no `md:` / `lg:` modifiers; the rendered tree is identical at 375px and 1528px.
- **Issue:** ~~**Partial 2026-06-12** — desktop content max-width widened on the high-traffic pages (HomePage feed `md:max-w-2xl`, SendRide `md:max-w-xl`, PhoneBook + NotificationsHistory `max-w-3xl`); MainLayout + Sidebar gained a persistent desktop nav (F45) and the desktop main shifts with `md:mr-64`. Touch targets keep the mobile 44px baseline and collapse to 36px at `md:` (Button/Input primitives). What's left for a future pass: multi-column treatments (e.g., feed + sidebar widget on desktop), HomePage empty-state desktop sizing, CommitteeDashboard desktop density, hover/focus polish on individual Cards. Mobile baseline is preserved.~~ **Confirmed live.** At desktop widths the entire UI sits in a centered narrow column with large empty rails on both sides. Density, hierarchy, and navigation patterns that work on a phone do not automatically read well at desktop scale.
- **Acceptance:** Each screen has an intentional desktop treatment (wider content area where it helps, multi-column where appropriate, persistent navigation). The desktop view no longer looks like a mobile screenshot embedded on a wide monitor. Mobile layout remains the baseline and is not regressed.

#### [x] F45. Sidebar uses a mobile-only drawer pattern
- **Where:** `MainLayout.jsx` + `Sidebar.jsx`.
- **Issue:** The drawer-with-backdrop is the correct mobile pattern but the wrong desktop pattern. At desktop widths the convention (Material Adaptive Navigation, common SaaS patterns) is a persistent sidebar or nav rail so navigation is always one click away without a tap-to-open ceremony.
- **Acceptance:** On desktop widths the sidebar is visible and stable by default; the hamburger toggle is hidden or repurposed (collapse/expand). On mobile widths the existing drawer behavior is preserved unchanged.

#### [x] F46. Hover states are not differentiated from press / default
- **Where:** Most buttons, cards, and tappable surfaces app-wide.
- **Issue:** Components rely on `active:scale-95` or flat `hover:bg-*` shifts that read as press feedback, not as desktop hover affordance. Mouse users get little advance signal that a card or icon is interactive before clicking. Cursor change alone is not enough.
- **Acceptance:** Every interactive surface has three visually distinct states — default, hover, pressed — verified with a mouse on desktop. Pressed remains differentiated from hover.

#### [x] F47. Icon-only controls have no tooltips on desktop
- **Where:** All icon-only controls (header Menu, FAB, Share2, modal close X, etc.).
- **Issue:** On desktop, hovering an unfamiliar icon should reveal its purpose. Mobile is forgiven (no hover), but desktop users have an unmet expectation that compounds the missing aria-labels (F5).
- **Acceptance:** Hovering any icon-only control on desktop reveals a tooltip with the control's accessible name within ~300ms. Mobile is unaffected.

---

### Phase 3 — Polish (consistency, micro-interactions, content)

#### [ ] F29. Five different primary-CTA styles in one app
- **Where:** LoginPage (raw, ~40px, teal-600), RegisterPage (44px, teal-600), SendRide (~64px, orange→pink gradient), Settings (36px, teal-600), VerificationEmailSent (48px, teal-600 + pulse), Onboarding (teal→emerald gradient).
- **Issue:** Inconsistent height, color, and treatment for the same role across the app.
- **Acceptance:** One documented primary CTA style. Variants (size, destructive, secondary) are clearly defined and reused.

#### [ ] F30. Sidebar icons use a rainbow without meaning
- **Where:** `Sidebar.jsx`.
- **Issue:** Home=green, Car=orange, Phonebook=yellow, Bell=red, Shield=amber, Settings=default, Logout=red. Color is decorative for nav items but semantic for destructive — the signal is diluted.
- **Acceptance:** Color in the sidebar conveys meaning only where it must (destructive = red, active = brand). Decorative nav icons share a neutral treatment so the red Logout stands out.

#### [ ] F31. Filled-vs-outline icon mixing for the same concept
- **Where:** Committee Shield is filled (amber circle) in FeedPosts, stroked (no fill) in Sidebar.
- **Issue:** Inconsistent visual language for the same role.
- **Acceptance:** Each concept uses one icon variant across the app.

#### [ ] F32. Emoji used as iconography
- **Where:** PhoneBook title contains a "📖" emoji.
- **Issue:** Renders inconsistently across OS versions, cannot be themed, and breaks the Lucide-only icon family.
- **Acceptance:** No emoji used as structural icons anywhere. Lucide (or another vector set) is the sole icon source.

#### [ ] F33. Rides empty state is oversized and offers no action
- **Where:** `NoRidesMessage.jsx`.
- **Issue:** `text-4xl` "אין טרמפים כרגע" on `text-white/40` is huge and washed-out. There is no CTA to drive the user toward publishing a ride themselves.
- **Acceptance:** Empty state is appropriately sized at both phone and desktop widths (not centered alone in an oceanic desktop viewport), meets contrast, and includes a primary action that converts visitors into contributors ("שתף נסיעה" / publish a ride).

#### [ ] F34. Notifications empty state has the same washed-out problem
- **Where:** `NotificationsHistory.jsx`.
- **Issue:** Low-contrast text and no follow-up action.
- **Acceptance:** Empty state is readable and contextual ("the committee hasn't posted lately — here's how to subscribe / enable push" or similar).

#### [ ] F35. RTL arrow rendered as Unicode glyph instead of an icon
- **Where:** `RideDetailsModal.jsx` — `◄` between origin and destination.
- **Issue:** Unicode arrows render inconsistently and don't respect direction logically; mixes a glyph into a Lucide-only system.
- **Acceptance:** Direction arrows use Lucide icons and point correctly in RTL contexts.

#### [ ] F36. CommitteeDashboard layout overflows horizontally
- **Where:** `CommitteeDashboard` (live URL — file not yet audited in detail).
- **Issue:** **Confirmed live.** Heading content runs off the right edge of the viewport even at desktop widths. Untested on actual mobile but very likely to be worse.
- **Acceptance:** Page audit completed; no horizontal overflow on any device width; tabs/headings wrap or truncate gracefully.

#### [ ] F37. Tabular figures missing on time/seat counts
- **Where:** RideCard ("N דקות"), PublicDisplay countdown.
- **Issue:** Proportional digits cause layout shimmer as numbers count down or update.
- **Acceptance:** All countdown/count text uses tabular figures, eliminating column jitter.

#### [ ] F38. Container max-widths are inconsistent
- **Where:** Various pages use `max-w-md`, `max-w-lg`, `max-w-2xl` interchangeably.
- **Issue:** Different "ideal width" per page makes the app feel like several apps stitched together on tablet/desktop.
- **Acceptance:** A small set of named content widths (e.g., narrow / standard / wide) is defined and used purposefully per page type.

#### [ ] F39. Header gradient title truncates mid-word
- **Where:** `MainLayout.jsx` — `max-w-[200px]` on the city/community heading.
- **Issue:** Long community names get cut without ellipsis; in RTL the cut is at the start of the word, which reads as broken.
- **Acceptance:** Long community names truncate with a proper ellipsis OR shrink/wrap gracefully, never appearing as a half-word with a hard edge.

#### [ ] F40. Secondary text contrast is borderline or failing
- **Where:** `text-slate-500` and `text-slate-600` used for footer credits, hints, "no contacts" message, etc.
- **Issue:** Measured `slate-500` on `slate-900` = 3.75:1 (large-text only); `slate-600` on `slate-900` = 2.36:1 (fail).
- **Acceptance:** All informational text meets WCAG AA (4.5:1 for body, 3:1 for large). Truly de-emphasized text is achieved through weight / hierarchy, not by lowering contrast below the threshold.

#### [ ] F41. FAB stays interactive while sidebar is open
- **Where:** `HomePage.jsx` — `FloatingActionButton`.
- **Issue:** When the drawer is open, the FAB is rendered dimmed but still in the tab order and can be activated through edge gestures. Also positioned without `safe-area-inset-bottom`, risking collision with the iOS gesture bar. FAB is a mobile-native pattern — on desktop a floating action at the bottom corner reads as out-of-place.
- **Acceptance:** On mobile, FAB is fully removed (not just visually dimmed) while the sidebar is open, and its position respects the bottom safe area. On desktop, the same action ("create post") is reachable from a desktop-natural location (header CTA, sidebar action, or keyboard shortcut) instead of — or in addition to — the FAB.

#### [ ] F42. Autofill override is hard-coded to a dark surface color
- **Where:** `src/index.css` — `:-webkit-autofill` rule.
- **Issue:** Forces `#0f172a` background. Works for current dark forms; will look broken the day a form lands on a lighter surface.
- **Acceptance:** Autofill background follows theme tokens (or the rule is scoped to dark surfaces explicitly), so adding a light-surface form does not introduce a black autofilled box.

#### [ ] F43. Spinners have no text fallback for reduced-motion
- **Where:** Every `<Loader2 className="animate-spin" />` usage.
- **Issue:** With reduced motion on, the spinner can appear frozen, giving no signal that work is in progress.
- **Acceptance:** Loading states pair the spinner with explicit "טוען..." text (or equivalent) so users always know the app is working.

---

## Open Questions / Items Requiring Owner Input

These were noted during the audit but need product decisions before they become actionable findings:

- **Push notifications UX** — the `usePushNotifications` hook runs at the app root but no in-app surface explains permission state or recovery if the user denies. Worth a dedicated UX pass.
- **Onboarding error handling** — current behavior on duplicate community join is to silently refresh on `"already assigned"`. Confirm this is the intended UX.
- **Ride details "הצטרף לנסיעה" CTA** has no handler wired. Either implement or remove until ready.
- **Tablet and landscape behavior** were not audited; the app forces a phone-like layout at every width. Decide whether tablets/landscape need a distinct treatment for the committee dashboard at minimum.
- **Push of post deep links** — `FeedPosts` builds a `#post-${id}` link for the WhatsApp share. Confirm router actually scrolls to that anchor.

---

## Discovered During Remediation

> Add new findings here as they surface while working through the plan. Same format: `[ ] F##. Title` + Where / Issue / Acceptance.
