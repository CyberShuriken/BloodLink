# Design Document — bloodlink-ui-foundation

## Overview

This document describes the technical design for the BloodLink UI Foundation feature. It covers the file structure, component architecture, data flow, and implementation details for the root layout, global navigation, Donor Dashboard, and all supporting components. Every decision maps directly to the requirements in `requirements.md`.

---

## 1. File Structure

```
src/
├── app/
│   ├── layout.tsx                          ← Root layout (Req 1)
│   ├── globals.css                         ← Blood theme tokens (Req 2)
│   ├── page.tsx                            ← Public landing page
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   ├── register/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx                      ← Dashboard shell (Req 7)
│   │   └── dashboard/page.tsx              ← Donor Dashboard (Req 8, 9)
│   └── auth/callback/route.ts
├── components/
│   ├── ui/                                 ← shadcn (already generated)
│   ├── layout/
│   │   ├── Navbar.tsx                      ← Desktop nav (Req 5)
│   │   ├── MobileNav.tsx                   ← Mobile nav (Req 6)
│   │   └── UserProfileContext.tsx          ← React context (Req 7)
│   ├── dashboard/
│   │   ├── StatsCard.tsx                   ← (Req 14)
│   │   ├── EligibilityBanner.tsx           ← (Req 13)
│   │   ├── ActivityFeed.tsx                ← (Req 9)
│   │   └── EmergencyAlert.tsx              ← Realtime toast (Req 15)
│   ├── donors/
│   │   └── DonorMap.tsx                    ← Leaflet map (Req 10)
│   ├── requests/
│   │   └── RequestCard.tsx                 ← (Req 17)
│   └── shared/
│       ├── BloodTypeBadge.tsx              ← (Req 11)
│       ├── UrgencyBadge.tsx                ← (Req 12)
│       ├── SkeletonLoader.tsx              ← (Req 16)
│       └── EmptyState.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   └── server.ts
│   ├── constants.ts                        ← (Req 18)
│   ├── validations.ts                      ← Zod schemas (Req 4)
│   └── utils.ts
├── types/
│   └── index.ts                            ← TypeScript types (Req 3)
└── hooks/
    └── useNotifications.ts
middleware.ts
tailwind.config.ts                          ← Blood theme (Req 2)
```

---

## 2. Tailwind Blood Theme (`tailwind.config.ts`)

Extend the existing config — do **not** replace it. Merge these additions into `theme.extend`:

```typescript
// theme.extend.colors additions
blood: {
  DEFAULT: '#C41E3A',
  dark:    '#8B0000',
  light:   '#F5C6CE',
  muted:   '#FDF0F2',
},
crimson: '#C41E3A',

// theme.extend.keyframes additions
'pulse-crimson': {
  '0%, 100%': { transform: 'scale(1)',    opacity: '1'   },
  '50%':       { transform: 'scale(1.05)', opacity: '0.85' },
},
'flash-red': {
  '0%, 100%': { opacity: '1'   },
  '50%':       { opacity: '0.6' },
},

// theme.extend.animation additions
'pulse-crimson': 'pulse-crimson 1.5s ease-in-out infinite',
'flash-red':     'flash-red 1s ease-in-out infinite',
```

### `globals.css` — replace CSS variable block

The `:root` block is updated to set the BloodLink theme. The `--primary` and `--ring` variables override the default slate values so all Shadcn components inherit the crimson accent automatically:

```css
:root {
  /* Shadcn semantic tokens — blood theme */
  --background:          0 0% 100%;
  --foreground:          224 71% 4%;
  --card:                0 0% 100%;
  --card-foreground:     224 71% 4%;
  --popover:             0 0% 100%;
  --popover-foreground:  224 71% 4%;
  --primary:             0 75% 42%;      /* #C41E3A */
  --primary-foreground:  0 0% 100%;
  --secondary:           0 30% 96%;
  --secondary-foreground:0 50% 25%;
  --muted:               220 14% 96%;
  --muted-foreground:    220 9% 46%;
  --accent:              0 75% 42%;
  --accent-foreground:   0 0% 100%;
  --destructive:         0 84% 60%;
  --destructive-foreground: 0 0% 100%;
  --border:              220 13% 91%;
  --input:               220 13% 91%;
  --ring:                0 75% 42%;
  --radius:              0.75rem;

  /* Raw hex tokens for non-Tailwind CSS */
  --blood-red:   #C41E3A;
  --blood-dark:  #8B0000;
  --blood-light: #F5C6CE;
  --blood-muted: #FDF0F2;
}

.dark {
  --background:          224 71% 4%;
  --foreground:          0 0% 98%;
  --primary:             0 75% 55%;
  --primary-foreground:  0 0% 100%;
  --ring:                0 75% 55%;
  /* … remaining dark tokens … */
}
```

---

## 3. TypeScript Types (`src/types/index.ts`)

All types are plain TypeScript — no runtime code.

```
BloodType       = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
UserRole        = 'donor' | 'patient' | 'hospital_staff' | 'blood_bank_admin' | 'admin'
RequestStatus   = 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired'
ResponseStatus  = 'pending' | 'accepted' | 'rejected' | 'completed' | 'no_show'
UrgencyLevel    = 'critical' | 'urgent' | 'normal'

NavItem         { label, href, icon: LucideIcon, badge?: number }
DashboardStats  { totalDonations, liveRequestsNearby, nextEligibleDate, donorRank }

Profile         — mirrors profiles table (all optional fields marked with ?)
BloodRequest    — mirrors blood_requests table + optional joined profiles?: Profile
DonorResponse   — mirrors donor_responses + optional joined profiles?, blood_requests?
Donation        — mirrors donations table (response_id?, request_id?, certificate_url? optional)
Notification    — mirrors notifications table (type: 'emergency'|'response'|'system'|'reminder')
BloodInventory  — mirrors blood_inventory table
```

`LucideIcon` is imported as `import type { LucideIcon } from 'lucide-react'`.

---

## 4. Zod Validation Schemas (`src/lib/validations.ts`)

| Schema | Key rules |
|---|---|
| `registerSchema` | email, password ≥8 chars, full_name ≥2 chars |
| `profileCompleteSchema` | student_id, department, batch (4-digit `/^\d{4}$/`), blood_type enum, contact_number BD regex, addresses ≥10 chars, divisions enum, bio ≤300 |
| `bloodRequestSchema` | patient_name ≥2, blood_type enum, units_needed int 1–10, urgency enum, hospital fields, contact BD regex, description ≤500, needed_before optional ISO string |
| `donorResponseSchema` | message ≤300 optional |

Exported inferred types: `RegisterInput`, `ProfileCompleteInput`, `BloodRequestInput`, `DonorResponseInput`.

---

## 5. Root Layout (`src/app/layout.tsx`)

```
RootLayout
  <html lang="en">
    <body className={geistSans.variable + geistMono.variable + " antialiased"}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        {children}
        <Toaster position="bottom-right" richColors />
      </ThemeProvider>
    </body>
  </html>
```

- Uses Next.js 14 `Metadata` export for title/description
- Uses Next.js 14 `viewport` export (not manual `<meta>`) for mobile scaling
- `ThemeProvider` from `next-themes`; `Toaster` from `sonner`
- Geist fonts loaded via `next/font/local` (files already in `src/app/fonts/`)

---

## 6. Application Constants (`src/lib/constants.ts`)

Mirrors Section 8 of `BLOODLINK_AGENT_SPEC.md` exactly. Key exports:

- `BLOOD_TYPES` — const tuple of 8 values
- `BLOOD_COMPATIBILITY` — Record<string, string[]> (O- → all 8, AB+ → ['AB+'])
- `DIVISIONS_DISTRICTS` — Record<string, string[]> for 8 Bangladesh divisions
- `DEPARTMENTS` — string[]
- `URGENCY_CONFIG` — `{ critical: { label, color, icon }, urgent: …, normal: … }`
- `BLOOD_TYPE_COLORS` — Record<BloodType, string> Tailwind class strings
- `DONATION_COOLDOWN_DAYS` — `90`

---

## 7. Dashboard Layout (`src/app/(dashboard)/layout.tsx`)

### Data flow

```
Server Component (layout.tsx)
  1. createClient() from @/lib/supabase/server
  2. supabase.auth.getUser()  →  if null, redirect('/login')
  3. supabase.from('profiles').select('*').eq('id', user.id).single()
  4. Pass profile to <UserProfileContext.Provider value={profile}>
  5. Render:
       <UserProfileContext.Provider>
         <Navbar profile={profile} />           ← hidden on mobile
         <MobileHeader profile={profile} />     ← Sheet trigger on mobile
         <main className="pb-20 md:pb-0 pt-16 md:pt-0">
           {children}
         </main>
         <MobileNav profile={profile} />        ← hidden on desktop
       </UserProfileContext.Provider>
```

`UserProfileContext` is a standard React context exported from `src/components/layout/UserProfileContext.tsx`. Client components access it via a `useUserProfile()` hook.

### Role-based conditional rendering

Links shown conditionally based on `profile.role`:
- `/admin` — only when `role === 'admin'`
- `/inventory` — only when `role === 'hospital_staff' || role === 'blood_bank_admin'`

---

## 8. Navbar (`src/components/layout/Navbar.tsx`)

**Client Component** (`'use client'`)

```
<nav className="hidden md:flex sticky top-0 z-50 h-16 bg-white border-b shadow-sm">
  ├── Left: Logo (blood-drop SVG + "BloodLink" text in text-blood font-bold)
  ├── Center: nav links (Dashboard, Find Donors, Requests, History, Notifications)
  │     Each <Link> uses usePathname() to add active styles:
  │     active: "font-semibold text-blood border-b-2 border-blood"
  │     inactive: "text-slate-600 hover:text-blood"
  └── Right:
        ├── NotificationBell (Bell icon + red badge if unread > 0)
        └── Avatar DropdownMenu
              ├── My Profile  → /profile
              ├── Settings    → /settings
              └── Sign Out    → supabase.auth.signOut() then router.push('/login')
```

Props: `profile: Profile`, notification count fetched via `useNotifications()` hook.

---

## 9. MobileNav (`src/components/layout/MobileNav.tsx`)

**Client Component** (`'use client'`)

```
<>
  {/* Mobile top header bar — Sheet trigger */}
  <div className="md:hidden fixed top-0 left-0 right-0 z-50 h-14 bg-white border-b flex items-center px-4">
    <Sheet>
      <SheetTrigger><Menu /></SheetTrigger>
      <SheetContent side="left">
        {/* Full nav link list including History, Notifications, Admin/Inventory (role-gated) */}
      </SheetContent>
    </Sheet>
    <span className="text-blood font-bold mx-auto">BloodLink</span>
  </div>

  {/* Bottom tab bar */}
  <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t h-16">
    <div className="grid grid-cols-5 h-full items-center">
      Tab: Home       → /dashboard
      Tab: Requests   → /requests
      [FAB: + button  → /requests/new  (centered, raised, bg-blood rounded-full)]
      Tab: Donors     → /donors
      Tab: Profile    → /profile  (+ unread badge capped at 99)
    </div>
  </nav>
</>
```

Active tab: `text-blood` + small 2×2 crimson dot above icon. Inactive: `text-slate-400`.

---

## 10. Donor Dashboard (`src/app/(dashboard)/dashboard/page.tsx`)

**Server Component** — fetches requests + donations server-side, passes as props to client sub-components.

```
Server fetch:
  - open blood_requests ordered by urgency (critical first via CASE in query)
  - donor's donations (last 10) for ActivityFeed
  - donor's stats (total_donations, nearby count approximated by district match)

Render:
  <EmergencyAlert profile={profile} />     ← client component, mounts realtime sub

  {/* Mobile: single column */}
  <div className="block lg:hidden space-y-4 p-4">
    <AvailabilityToggle profile={profile} />
    <EligibilityBanner ... />
    <h2>Nearby Emergency Alerts</h2>
    {loading ? <SkeletonLoader variant="card" /> : <RequestList requests={requests} />}
  </div>

  {/* Desktop: 3-column grid */}
  <div className="hidden lg:grid grid-cols-3 gap-6 p-6">
    {/* Left column */}
    <div className="space-y-4">
      <Avatar + full_name + BloodTypeBadge />
      <StatsCard title="Total Donations" ... />
      <StatsCard title="Requests Nearby" ... />
      <StatsCard title="Donor Rank" ... />
      <AvailabilityToggle profile={profile} />
    </div>

    {/* Center column */}
    <div>
      {mapLoading
        ? <SkeletonLoader variant="map" />
        : <ErrorBoundary fallback={<EmptyState message="Unable to load map" />}>
            <DonorMapWrapper profile={profile} requests={requests} />
          </ErrorBoundary>
      }
    </div>

    {/* Right column */}
    <div>
      {donationsLoading
        ? <SkeletonLoader variant="table" />
        : <ActivityFeed donations={donations} />
      }
    </div>
  </div>
```

### AvailabilityToggle

Client component. On click: `supabase.from('profiles').update({ is_available: !current }).eq('id', userId)`. Uses optimistic UI — toggles local state immediately, reverts on error.

---

## 11. DonorMap (`src/components/donors/DonorMap.tsx`)

Because Leaflet uses browser-only APIs, the actual map implementation lives in `DonorMapInner.tsx` and is wrapped by a dynamic import in `DonorMap.tsx`:

```typescript
// DonorMap.tsx (the exported wrapper)
const DonorMapInner = dynamic(() => import('./DonorMapInner'), { ssr: false, loading: () => <SkeletonLoader variant="map" /> })
export function DonorMap(props) { return <DonorMapInner {...props} /> }
```

**`DonorMapInner.tsx`** — Client Component:

```
imports:
  import 'leaflet/dist/leaflet.css'
  + Leaflet default icon fix (delete _getIconUrl, set iconUrl/iconRetinaUrl/shadowUrl to CDN)

<MapContainer
  center={[profile.latitude ?? 23.8103, profile.longitude ?? 90.4125]}
  zoom={12}
  style={{ height: '400px', width: '100%' }}
>
  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="© OSM" />

  {/* Donor's own marker — blue icon */}
  {profile.latitude && <Marker position={[profile.latitude, profile.longitude]} icon={blueIcon} />}

  {/* Request markers — color by urgency */}
  {requests.filter(r => r.latitude && r.longitude).map(r => (
    <Marker key={r.id} position={[r.latitude, r.longitude]} icon={urgencyIcon(r.urgency)}>
      <Popup>
        <p>{r.hospital_name}</p>
        <BloodTypeBadge bloodType={r.blood_type} />
        <UrgencyBadge urgency={r.urgency} />
        <Link href={`/requests/${r.id}`}>Respond</Link>
      </Popup>
    </Marker>
  ))}
</MapContainer>
```

Urgency → icon color: `critical` = red, `urgent` = orange, `normal` = blue (using Leaflet `divIcon` with Tailwind color classes baked in).

---

## 12. EmergencyAlert (`src/components/dashboard/EmergencyAlert.tsx`)

**Client Component** (`'use client'`, `useEffect`)

```typescript
useEffect(() => {
  if (!profile.is_available) return  // Req 15.6

  const channel = supabase
    .channel('emergency-blood-requests')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blood_requests' },
      (payload) => {
        const req = payload.new as BloodRequest
        if (req.urgency !== 'critical') return
        if (!req.latitude || !req.longitude) return
        const dist = haversineKm(profile.latitude, profile.longitude, req.latitude, req.longitude)
        if (dist > 10) return

        toast.custom(
          (t) => (
            <div className="bg-white border-l-4 border-blood rounded-lg shadow-lg p-4 animate-flash-red">
              <p className="font-bold text-blood">🚨 Critical Blood Request</p>
              <p>{req.hospital_name} needs <strong>{req.blood_type}</strong></p>
              <Link href={`/requests/${req.id}`} onClick={() => toast.dismiss(t)}>
                Respond Now →
              </Link>
            </div>
          ),
          { duration: 15000 }
        )
      })
    .subscribe()

  return () => { supabase.removeChannel(channel) }  // Req 15.7
}, [profile.is_available, profile.latitude, profile.longitude])
```

**Haversine formula** (pure function in `src/lib/utils.ts`):

```typescript
export function haversineKm(lat1: number | undefined, lon1: number | undefined,
                             lat2: number, lon2: number): number {
  if (!lat1 || !lon1) return Infinity
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = Math.sin(dLat/2)**2 +
            Math.cos(lat1 * Math.PI/180) * Math.cos(lat2 * Math.PI/180) * Math.sin(dLon/2)**2
  return R * 2 * Math.asin(Math.sqrt(a))
}
```

---

## 13. Shared Components

### BloodTypeBadge

```
Props: { bloodType: BloodType, size?: 'sm' | 'md' | 'lg' }

<span
  className={cn(BLOOD_TYPE_COLORS[bloodType], 'font-mono font-bold rounded-full border', sizeClasses[size])}
  aria-label={`Blood type ${bloodType}`}
>
  {bloodType}
</span>

sizeClasses = { sm: 'text-xs px-2 py-0.5', md: 'text-sm px-3 py-1', lg: 'text-lg px-4 py-2' }
```

### UrgencyBadge

```
Props: { urgency: UrgencyLevel }

<span
  role="status"
  aria-label={`Urgency: ${urgency}`}
  className={cn(URGENCY_CONFIG[urgency].color, 'inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium',
    urgency === 'critical' && 'animate-pulse')}
>
  {URGENCY_CONFIG[urgency].icon} {URGENCY_CONFIG[urgency].label}
</span>
```

### EligibilityBanner

```
Props: { isEligible: boolean, lastDonationDate: string | null }

<div role="alert" aria-live="polite" className={bannerClass}>
  {isEligible
    ? <><CheckCircle /> You are eligible to donate!</>
    : lastDonationDate
      ? <><Clock /> Next eligible date: {format(addDays(parseISO(lastDonationDate), 90), 'dd MMM yyyy')}</>
      : <>Eligibility status is being reviewed</>
  }
</div>
```

Colour classes: eligible = `bg-green-50 border-green-200 text-green-800`, ineligible = `bg-yellow-50 border-yellow-200 text-yellow-800`.

### StatsCard

```
Props: { title, value, icon: LucideIcon, description?, trend?: 'up'|'down'|'neutral' }

<Card className="hover:shadow-md transition-shadow duration-200">
  <CardContent className="flex items-center gap-4 p-4">
    <div className="rounded-full bg-blood-muted p-2 text-blood"><Icon /></div>
    <div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-muted-foreground text-sm">{title}</p>
      {trend === 'up'   && <span className="text-green-600 flex items-center gap-1"><TrendingUp size={14} />{description}</span>}
      {trend === 'down' && <span className="text-red-600   flex items-center gap-1"><TrendingDown size={14} />{description}</span>}
    </div>
  </CardContent>
</Card>
```

### SkeletonLoader

```
Props: { variant: 'card' | 'table' | 'map' | 'stats' }

<div aria-hidden="true">
  <span className="sr-only">Loading...</span>
  {variant === 'map'   && <div className="animate-pulse bg-muted rounded-xl" style={{ minHeight: 400 }} />}
  {variant === 'table' && Array.from({length:5}).map((_,i) => <div key={i} className="animate-pulse bg-muted h-10 rounded mb-2" />)}
  {variant === 'stats' && <div className="grid grid-cols-3 gap-4">{...3 card placeholders}</div>}
  {variant === 'card'  && <div className="animate-pulse bg-muted rounded-xl h-32" />}
</div>
```

### RequestCard

```
Props: { request: BloodRequest }

<article
  aria-label={`Blood request at ${request.hospital_name}, urgency ${request.urgency}, blood type ${request.blood_type}`}
  className={cn('rounded-xl border p-4', request.urgency === 'critical' && 'border-l-4 border-blood bg-blood-muted')}
>
  <div className="flex items-center justify-between">
    <h3 className="font-semibold">{request.hospital_name}</h3>
    <UrgencyBadge urgency={request.urgency} />
  </div>
  <p className="text-muted-foreground text-sm">{request.district}</p>
  <div className="flex items-center gap-2 mt-2">
    <BloodTypeBadge bloodType={request.blood_type} />
    <span className="text-sm">{request.units_needed} units needed</span>
    <span className="text-xs text-muted-foreground ml-auto">{formatDistanceToNow(parseISO(request.created_at))} ago</span>
  </div>
  <Link href={`/requests/${request.id}`}>
    <Button variant="outline" size="sm" className="mt-3 w-full">View Details</Button>
  </Link>
</article>
```

---

## 14. Supabase Client Setup

Two clients follow the `@supabase/ssr` pattern:

**`src/lib/supabase/client.ts`** — browser (Client Components)
```typescript
import { createBrowserClient } from '@supabase/ssr'
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**`src/lib/supabase/server.ts`** — server (Server Components, Route Handlers)
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll(cs) { try { cs.forEach(({name,value,options}) => cookieStore.set(name,value,options)) } catch {} } } }
  )
}
```

---

## 15. Data Flow Summary

```
Server (layout.tsx)
  │ getUser() + profiles query
  │
  ▼
UserProfileContext.Provider  ──────────────────────────────┐
  │                                                         │
  ├─▶ Navbar (client)                                       │
  │     useUserProfile() hook                               │
  │                                                         │
  ├─▶ MobileNav (client)                                    │
  │                                                         │
  └─▶ dashboard/page.tsx (server)                           │
        │ fetch blood_requests (open, ordered urgency)      │
        │ fetch donations (last 10)                         │
        │                                                   │
        ▼                                                   │
      Client Components                                     │
        AvailabilityToggle  ─ supabase.from('profiles')     │
        EmergencyAlert      ─ supabase.channel() realtime ◀─┘
        DonorMap            ─ react-leaflet (ssr:false)
        ActivityFeed        ─ pure render (receives donations[])
```

---

## 16. Route Protection (`middleware.ts`)

The existing middleware pattern from the spec is used verbatim — checks auth on every protected route and redirects to `/login` if no session exists. The layout also performs a server-side redirect as a second layer of protection.

---

## 17. Accessibility Notes

- All badges include `aria-label`
- `UrgencyBadge` uses `role="status"`
- `EligibilityBanner` uses `role="alert"` + `aria-live="polite"`
- `SkeletonLoader` uses `aria-hidden="true"` + `.sr-only` "Loading..." span
- `RequestCard` uses `<article>` with a descriptive `aria-label`
- Focus rings use the blood theme `--ring` variable (crimson) automatically via Shadcn
