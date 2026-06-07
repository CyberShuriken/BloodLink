# Implementation Plan: BloodLink UI Foundation

## Overview

This plan implements the complete front-end foundation for the BloodLink emergency blood coordination platform. Tasks are ordered by dependency: shared primitives (types, constants, schemas, Supabase clients) come first, followed by the design system, then layout shells, then components in dependency order, and finally the full dashboard page and route protection.

## Tasks

- [x] 1. Foundation — Types, Constants & Zod Schemas
  - Create `src/types/index.ts` exporting `BloodType`, `UserRole`, `RequestStatus`, `ResponseStatus`, `UrgencyLevel` union types; `Profile`, `BloodRequest`, `DonorResponse`, `Donation`, `Notification`, `BloodInventory`, `NavItem`, `DashboardStats` interfaces; import `LucideIcon` from `lucide-react`.
  - file: src/types/index.ts
  - requirements: [3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7]

- [x] 2. Application Constants
  - Create `src/lib/constants.ts` exporting `BLOOD_TYPES` const tuple, `BLOOD_COMPATIBILITY` Record (O- maps to all 8 types, AB+ maps to only ['AB+']), `DIVISIONS_DISTRICTS` for 8 Bangladesh divisions, `DEPARTMENTS` string array, `URGENCY_CONFIG` mapping each `UrgencyLevel` to `{ label, color, icon }`, `BLOOD_TYPE_COLORS` Record<BloodType, string> with Tailwind class strings, `DONATION_COOLDOWN_DAYS = 90`.
  - file: src/lib/constants.ts
  - requirements: [18.1, 18.2, 18.3, 18.4]

- [x] 3. Zod Validation Schemas
  - Create `src/lib/validations.ts` exporting `registerSchema` (email, password ≥8, full_name ≥2), `profileCompleteSchema` (student_id, department, batch `/^\d{4}$/`, blood_type enum, contact_number Bangladeshi regex `^(\+88)?01[3-9]\d{8}$`, addresses ≥10 chars, divisions enum, optional bio ≤300), `bloodRequestSchema` (patient_name ≥2, blood_type, units_needed int 1–10, urgency enum, hospital fields, contact BD regex, optional description ≤500 and needed_before ISO string), `donorResponseSchema` (optional message ≤300); export inferred types `RegisterInput`, `ProfileCompleteInput`, `BloodRequestInput`, `DonorResponseInput`.
  - file: src/lib/validations.ts
  - requirements: [4.1, 4.2, 4.3, 4.4, 4.5, 4.6]

- [x] 4. Supabase Browser Client
  - Create `src/lib/supabase/client.ts` using `createBrowserClient` from `@supabase/ssr` with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`; export a `createClient()` function for use in Client Components.
  - file: src/lib/supabase/client.ts
  - requirements: [7.3]

- [x] 5. Supabase Server Client
  - Create `src/lib/supabase/server.ts` using `createServerClient` from `@supabase/ssr` with `cookies()` from `next/headers`; implement `getAll` and `setAll` cookie adapters (try/catch on `setAll`); export a `createClient()` function for Server Components and Route Handlers.
  - file: src/lib/supabase/server.ts
  - requirements: [7.3]

- [x] 6. Haversine Distance Utility
  - Add `haversineKm(lat1, lon1, lat2, lon2): number` pure function to `src/lib/utils.ts` using the Haversine formula (R = 6371 km); return `Infinity` when `lat1` or `lon1` is falsy; preserve existing `cn` utility.
  - file: src/lib/utils.ts
  - requirements: [15.5]

- [x] 7. Tailwind Blood Theme Configuration
  - Update `tailwind.config.ts` to merge into `theme.extend.colors`: `blood: { DEFAULT: '#C41E3A', dark: '#8B0000', light: '#F5C6CE', muted: '#FDF0F2' }` and `crimson: '#C41E3A'`; add `pulse-crimson` keyframe (0%/100% scale(1) opacity 1, 50% scale(1.05) opacity 0.85) and `flash-red` keyframe (0%/100% opacity 1, 50% opacity 0.6); add animation entries `'pulse-crimson': 'pulse-crimson 1.5s ease-in-out infinite'` and `'flash-red': 'flash-red 1s ease-in-out infinite'`; preserve all existing config.
  - file: tailwind.config.ts
  - requirements: [2.1, 2.2, 2.7]

- [x] 8. Global CSS Blood Theme Tokens
  - Update `src/app/globals.css` `:root` block: set `--primary: 0 75% 42%`, `--ring: 0 75% 42%`, `--radius: 0.75rem`, update foreground/card/popover/secondary/accent tokens for the blood theme; add raw hex custom properties `--blood-red: #C41E3A`, `--blood-dark: #8B0000`, `--blood-light: #F5C6CE`, `--blood-muted: #FDF0F2`; keep `.dark` block and `@layer base` rules intact.
  - file: src/app/globals.css
  - requirements: [2.3, 2.4, 2.5, 2.6]

- [x] 9. Root Layout
  - Rewrite `src/app/layout.tsx`: set `html lang="en"`; load Geist Sans and Geist Mono via `next/font/local` from `./fonts/GeistVF.woff` and `./fonts/GeistMonoVF.woff`; apply both font CSS variables and `antialiased` to `<body>`; export `Metadata` with `title: "BloodLink — Emergency Blood Coordination"` and `description: "Connect donors, hospitals, and blood banks in one coordinated network"`; export `viewport` object (`width: 'device-width', initialScale: 1`); wrap children in `<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>` from `next-themes`; render `<Toaster position="bottom-right" richColors />` from `sonner` inside the body.
  - file: src/app/layout.tsx
  - requirements: [1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7]

- [ ] 10. BloodTypeBadge Component
  - Create `src/components/shared/BloodTypeBadge.tsx` accepting `bloodType: BloodType` and optional `size?: 'sm' | 'md' | 'lg'` (default `'md'`); render `<span>` with `font-mono font-bold rounded-full border`; look up background/text colors from `BLOOD_TYPE_COLORS`; size classes: sm → `text-xs px-2 py-0.5`, md → `text-sm px-3 py-1`, lg → `text-lg px-4 py-2`; include `aria-label={"Blood type " + bloodType}`.
  - file: src/components/shared/BloodTypeBadge.tsx
  - requirements: [11.1, 11.2, 11.3, 11.4, 11.5]

- [ ] 11. UrgencyBadge Component
  - Create `src/components/shared/UrgencyBadge.tsx` accepting `urgency: UrgencyLevel`; render `<span role="status" aria-label={"Urgency: " + urgency}>`; apply color and icon from `URGENCY_CONFIG`; apply `animate-pulse` when `urgency === 'critical'`; use `inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium`.
  - file: src/components/shared/UrgencyBadge.tsx
  - requirements: [12.1, 12.2, 12.3, 12.4]

- [ ] 12. EligibilityBanner Component
  - Create `src/components/shared/EligibilityBanner.tsx` accepting `isEligible: boolean` and `lastDonationDate: string | null`; wrap in `<div role="alert" aria-live="polite">`; when eligible render green banner (`bg-green-50 border-green-200 text-green-800`) with Lucide `CheckCircle` and "You are eligible to donate!"; when ineligible with date render yellow banner with Lucide `Clock` and "Next eligible date: {format(addDays(parseISO(lastDonationDate), 90), 'dd MMM yyyy')}" using `date-fns`; when ineligible without date render "Eligibility status is being reviewed".
  - file: src/components/shared/EligibilityBanner.tsx
  - requirements: [13.1, 13.2, 13.3, 13.4, 13.5]

- [ ] 13. SkeletonLoader Component
  - Create `src/components/shared/SkeletonLoader.tsx` accepting `variant: 'card' | 'table' | 'map' | 'stats'`; wrap in `<div aria-hidden="true">` with `<span className="sr-only">Loading...</span>`; map → `animate-pulse bg-muted rounded-xl` at minHeight 400px; table → 5 rows of `animate-pulse bg-muted h-10 rounded mb-2`; stats → `grid grid-cols-3 gap-4` with 3 card placeholders; card → single `animate-pulse bg-muted rounded-xl h-32`.
  - file: src/components/shared/SkeletonLoader.tsx
  - requirements: [16.1, 16.2, 16.3, 16.4, 16.5]

- [ ] 14. EmptyState Component
  - Create `src/components/shared/EmptyState.tsx` accepting `message: string`; render centered container with Lucide `Inbox` icon, muted text, `flex flex-col items-center justify-center gap-2 py-12 text-muted-foreground`.
  - file: src/components/shared/EmptyState.tsx
  - requirements: [8.6, 9.7]

- [ ] 15. StatsCard Component
  - Create `src/components/dashboard/StatsCard.tsx` accepting `title: string`, `value: string | number`, `icon: LucideIcon`, optional `description?: string`, optional `trend?: 'up' | 'down' | 'neutral'`; use Shadcn `Card`/`CardContent`; icon in `rounded-full bg-blood-muted p-2 text-blood`; value in `text-2xl font-bold`, title in `text-muted-foreground text-sm`; render `TrendingUp` with `text-green-600` when trend is 'up', `TrendingDown` with `text-red-600` when trend is 'down'; apply `hover:shadow-md transition-shadow duration-200`.
  - file: src/components/dashboard/StatsCard.tsx
  - requirements: [14.1, 14.2, 14.3, 14.4, 14.5]

- [ ] 16. ActivityFeed Component
  - Create `src/components/dashboard/ActivityFeed.tsx` accepting `donations: Donation[]`; render scrollable list (`overflow-y-auto max-h-96`) with formatted date, hospital name, `BloodTypeBadge`, and units donated per item; render `EmptyState` with "No donation history yet." when empty.
  - file: src/components/dashboard/ActivityFeed.tsx
  - requirements: [9.4]

- [ ] 17. RequestCard Component
  - Create `src/components/requests/RequestCard.tsx` accepting `request: BloodRequest`; use `<article aria-label={"Blood request at " + hospital_name + ", urgency " + urgency + ", blood type " + blood_type}>`; apply `border-l-4 border-blood bg-blood-muted` when `urgency === 'critical'`; render hospital_name heading, district subtext, `BloodTypeBadge` + `UrgencyBadge` row, units_needed count, `formatDistanceToNow(parseISO(request.created_at)) + " ago"`; include Next.js `<Link>` to `/requests/[id]` wrapping a Shadcn `<Button variant="outline" size="sm" className="mt-3 w-full">View Details</Button>`.
  - file: src/components/requests/RequestCard.tsx
  - requirements: [17.1, 17.2, 17.3, 17.4]

- [ ] 18. DonorMapInner Component (Leaflet implementation)
  - Create `src/components/donors/DonorMapInner.tsx` as a `'use client'` component; import `'leaflet/dist/leaflet.css'`; apply Leaflet default icon fix (delete `_getIconUrl`, set iconUrl/iconRetinaUrl/shadowUrl to CDN); render `<MapContainer>` centered on `[profile.latitude ?? 23.8103, profile.longitude ?? 90.4125]` zoom 12; add `<TileLayer>` with OpenStreetMap URL; render donor's own blue `<Marker>` when coordinates exist; map `requests` with non-null coordinates to urgency-colored `divIcon` markers (red/critical, orange/urgent, blue/normal); each marker has a `<Popup>` with hospital_name, `BloodTypeBadge`, `UrgencyBadge`, and "Respond" link; accept `profile: Profile` and `requests: BloodRequest[]` props.
  - file: src/components/donors/DonorMapInner.tsx
  - requirements: [10.1, 10.3, 10.4, 10.5, 10.6, 10.7]

- [ ] 19. DonorMap Wrapper Component (next/dynamic SSR-false)
  - Create `src/components/donors/DonorMap.tsx` using `next/dynamic` with `ssr: false` and `loading: () => <SkeletonLoader variant="map" />` to dynamically import `DonorMapInner`; forward all props to the dynamic component; export as default.
  - file: src/components/donors/DonorMap.tsx
  - requirements: [10.2]

- [ ] 20. EmergencyAlert Component (Supabase Realtime)
  - Create `src/components/dashboard/EmergencyAlert.tsx` as a `'use client'` component accepting `profile: Profile`; in `useEffect` (deps: is_available, latitude, longitude) return early if `!profile.is_available`; subscribe to `blood_requests` INSERT via Supabase channel; in handler skip if not critical, skip if no coordinates, skip if `haversineKm > 10`; call `toast.custom(...)` with crimson-accented div (`border-l-4 border-blood animate-flash-red`) showing `🚨 Critical Blood Request`, hospital_name, blood_type, and "Respond Now →" link; set `duration: 15000`; return cleanup calling `supabase.removeChannel(channel)`.
  - file: src/components/dashboard/EmergencyAlert.tsx
  - requirements: [15.1, 15.2, 15.3, 15.4, 15.5, 15.6, 15.7]

- [ ] 21. UserProfileContext
  - Create `src/components/layout/UserProfileContext.tsx` exporting a React context typed as `Profile | null` (default null) and a `useUserProfile()` hook that calls `useContext` and throws if used outside the provider; export both as named exports.
  - file: src/components/layout/UserProfileContext.tsx
  - requirements: [7.3]

- [ ] 22. Navbar Component
  - Create `src/components/layout/Navbar.tsx` as a `'use client'` component; render `<nav className="hidden md:flex sticky top-0 z-50 h-16 ...">` with left logo (blood-drop SVG + "BloodLink" in `text-blood font-bold`), center links (Dashboard, Find Donors, Requests, History, Notifications) using `usePathname()` for active styles (`font-semibold text-blood border-b-2 border-blood` active; `text-slate-600 hover:text-blood` inactive), right side with Lucide `Bell` + red badge when `unreadCount > 0` and Shadcn `Avatar` `DropdownMenu` (My Profile, Settings, Sign Out — sign out calls `supabase.auth.signOut()` then `router.push('/login')`); accept `profile: Profile` and `unreadCount: number` props.
  - file: src/components/layout/Navbar.tsx
  - requirements: [5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8]

- [ ] 23. MobileNav Component
  - Create `src/components/layout/MobileNav.tsx` as a `'use client'` component; render (1) `md:hidden fixed top-0` header with Shadcn `Sheet` (Menu icon trigger, full nav link list in SheetContent with role-gated admin/inventory links) and centered "BloodLink" title; (2) `md:hidden fixed bottom-0` tab bar with `grid grid-cols-5` containing Home (`/dashboard`, Lucide `Home`), Requests (`/requests`, Lucide `Droplet`), FAB+ button (`/requests/new`, `rounded-full bg-blood text-white`), Find Donors (`/donors`, Lucide `Users`), Profile (`/profile`, Lucide `User` + unread badge capped at 99); active tab gets `text-blood` and 2×2 crimson dot above icon; accept `profile: Profile` and `unreadCount: number` props.
  - file: src/components/layout/MobileNav.tsx
  - requirements: [6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7]

- [ ] 24. Dashboard Layout (server component)
  - Create `src/app/(dashboard)/layout.tsx` as a Server Component; call `createClient()` from `@/lib/supabase/server`; call `supabase.auth.getUser()` — redirect to `/login` if no session; query `profiles` table for the user; fetch unread notification count; wrap in `<UserProfileContext.Provider value={profile}>`; render `<Navbar>` (desktop), mobile top header in `<MobileNav>`, `<main className="pb-20 md:pb-0 pt-14 md:pt-16">`, and `<MobileNav>` (bottom); conditionally show admin/inventory links based on `profile.role`.
  - file: src/app/(dashboard)/layout.tsx
  - requirements: [7.1, 7.2, 7.3, 7.4, 7.5]

- [ ] 25. AvailabilityToggle Client Component
  - Create `src/app/(dashboard)/dashboard/AvailabilityToggle.tsx` as `'use client'`; accept `profile: Profile`; use `useState` initialised from `profile.is_available`; on click optimistically toggle state then call `supabase.from('profiles').update({ is_available: !current }).eq('id', profile.id)` — revert and show error toast on failure; render `<Button>` with `bg-blood text-white` and label "GO AVAILABLE" when not available, `bg-slate-500 text-white` and "OFF DUTY" when available.
  - file: src/app/(dashboard)/dashboard/AvailabilityToggle.tsx
  - requirements: [8.2, 8.3, 9.6]

- [ ] 26. Donor Dashboard Page
  - Create `src/app/(dashboard)/dashboard/page.tsx` as a Server Component; fetch open `blood_requests` ordered by urgency (critical first); fetch last 10 `donations` for the current user; compute DashboardStats; render `<EmergencyAlert profile={profile} />` at top; mobile layout (`block lg:hidden space-y-4 p-4`): `AvailabilityToggle`, `EligibilityBanner`, "Nearby Emergency Alerts" heading, `requests.map(r => <RequestCard />)` or `EmptyState` when empty; desktop layout (`hidden lg:grid grid-cols-3 gap-6 p-6`): left column (Avatar, full_name, BloodTypeBadge, three StatsCards, AvailabilityToggle), center column (error-boundary-wrapped DonorMap with EmptyState fallback "Unable to load map", SkeletonLoader while loading), right column (ActivityFeed, SkeletonLoader while loading).
  - file: src/app/(dashboard)/dashboard/page.tsx
  - requirements: [8.1, 8.2, 8.4, 8.5, 8.6, 8.7, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7]

- [ ] 27. Route Protection Middleware
  - Create `middleware.ts` at the project root; use `@supabase/ssr` `createServerClient` with request/response cookie helpers; protect `/dashboard`, `/profile`, `/requests/new`, `/donors`, `/history`, `/notifications`, `/inventory`, `/admin` — redirect unauthenticated users to `/login`; redirect authenticated users away from `/login` and `/register` to `/dashboard`; export `config.matcher` excluding static assets, `_next`, and `favicon.ico`.
  - file: middleware.ts
  - requirements: [7.4]

- [ ] 28. Auth Callback Route Handler
  - Create `src/app/auth/callback/route.ts` with a `GET` handler; read `code` from `request.nextUrl.searchParams`; if code present call `supabase.exchangeCodeForSession(code)` via server client; redirect to `/dashboard` on success, redirect to `/login?error=auth` on failure; use `NextResponse.redirect` with `request.nextUrl.origin` as base.
  - file: src/app/auth/callback/route.ts
  - requirements: [7.3]

## Task Dependency Graph

```json
{
  "waves": [
    {
      "wave": 1,
      "tasks": [1, 2, 4, 5, 6, 7, 8],
      "description": "Foundation primitives — no dependencies"
    },
    {
      "wave": 2,
      "tasks": [3, 9],
      "description": "Schemas (needs types), Root Layout (needs CSS tokens)"
    },
    {
      "wave": 3,
      "tasks": [10, 11, 12, 13, 14],
      "description": "Shared UI components (need types + design system)"
    },
    {
      "wave": 4,
      "tasks": [15, 16, 17, 18, 20, 21],
      "description": "Dashboard primitives and map inner (need shared components)"
    },
    {
      "wave": 5,
      "tasks": [19, 22, 23],
      "description": "DonorMap wrapper + navigation components"
    },
    {
      "wave": 6,
      "tasks": [24, 25, 27, 28],
      "description": "Dashboard layout, AvailabilityToggle, middleware, auth callback"
    },
    {
      "wave": 7,
      "tasks": [26],
      "description": "Donor Dashboard page — depends on all prior tasks"
    }
  ]
}
```

| Task | Depends On |
|------|-----------|
| 1    | —         |
| 2    | —         |
| 3    | 1         |
| 4    | —         |
| 5    | —         |
| 6    | —         |
| 7    | —         |
| 8    | —         |
| 9    | 8         |
| 10   | 1, 2, 7, 8 |
| 11   | 1, 2, 7, 8 |
| 12   | 1, 7, 8   |
| 13   | 7, 8      |
| 14   | 7, 8      |
| 15   | 1, 10, 7, 8 |
| 16   | 1, 10, 7, 8 |
| 17   | 1, 10, 11, 7, 8 |
| 18   | 1, 10, 11, 13, 4 |
| 19   | 13, 18    |
| 20   | 1, 4, 6, 10, 11 |
| 21   | 1         |
| 22   | 1, 4, 10, 11 |
| 23   | 1, 10, 11, 13 |
| 24   | 1, 5, 21, 22, 23 |
| 25   | 1, 4      |
| 26   | 1, 5, 10, 11, 12, 13, 14, 15, 16, 17, 19, 20, 24, 25 |
| 27   | 1, 5      |
| 28   | 5         |

## Notes

- All Leaflet components (tasks 18–19) must remain browser-only; never remove the `ssr: false` flag from `DonorMap.tsx`.
- The `haversineKm` utility (task 6) is used by both `EmergencyAlert` (task 20) and any future proximity-search features — keep it as a pure function with no side effects.
- Supabase cookie adapters in `server.ts` (task 5) must use try/catch on `setAll` to avoid errors in Server Components where cookies are read-only.
- The `AvailabilityToggle` (task 25) uses optimistic UI — always revert state and show a toast on Supabase update failure.
- CSS variable names in `globals.css` (task 8) must exactly match what Shadcn components expect (`--primary`, `--ring`, `--radius`, etc.) to avoid broken default component styles.
- The `DashboardLayout` (task 24) performs server-side auth redirect as a second layer of protection on top of middleware (task 27).
