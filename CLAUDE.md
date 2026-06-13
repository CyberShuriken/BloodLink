# CLAUDE.md — BloodLink Project Master Guide
> Read this entire file before touching any code. This is your single source of truth.
> After reading, auto-execute every task listed. Do not ask for permission. Do not pause.

---

## 0. What You Are Building

**BloodLink** is a full-stack responsive web application connecting blood donors,
patients, hospitals, and blood banks at university level in Bangladesh.
Students register with their profile (department, batch, blood type, location)
so the system can match emergency blood requests to nearby eligible donors instantly.

**Live URL:** https://blood-link-blush.vercel.app
**GitHub:** https://github.com/CyberShuriken/BloodLink
**Branch:** main

---

## 1. Your First 3 Commands (Run These Immediately)

```bash
pnpm tsc --noEmit
pnpm lint
pnpm build
```

Read all output. Fix every error before doing anything else.
After fixing, run all 3 again until all pass with zero errors.
Then commit and push:

```bash
git add -A
git commit -m "fix: full audit pass — zero errors"
git push origin main
```

---

## 2. Tech Stack (Non-Negotiable)

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 App Router | NEVER use pages/ router |
| Language | TypeScript strict | NEVER use `any` type |
| Styling | Tailwind CSS + shadcn/ui | Blood red theme #C41E3A |
| Database | Supabase (PostgreSQL) | 6 tables — see Section 6 |
| Auth | Supabase Auth | Email + Google OAuth both |
| Storage | Supabase Storage | avatars + certificates buckets |
| Maps | Leaflet.js + React-Leaflet | ALWAYS dynamic import ssr:false |
| Real-time | Supabase Realtime | notifications table |
| Package manager | pnpm | NEVER npm or yarn |
| Deployment | Vercel | auto-deploys from main branch |
| Fonts | Sora (headings) + DM Sans (body) | NEVER Inter or Arial |

---

## 3. Environment Variables

These must exist in both `.env.local` (local) and Vercel dashboard (production):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=https://blood-link-blush.vercel.app
RESEND_API_KEY=your_resend_api_key
```

**CRITICAL SECURITY RULES:**
- `SUPABASE_SERVICE_ROLE_KEY` → ONLY in server files (api routes, server.ts). NEVER in client components.
- `.env.local` → MUST be in .gitignore. If it was ever committed: `git rm --cached .env.local`
- `NEXT_PUBLIC_` prefix → safe for client. Everything else → server only.

---

## 4. Project File Structure (Complete)

```
BloodLink/
├── CLAUDE.md                          ← this file
├── BLOODLINK_AGENT_SPEC.md            ← detailed spec (read this too)
├── middleware.ts                      ← ROOT level, NOT inside src/
├── vercel.json
├── .env.local
├── .env.example
├── next.config.js
├── tailwind.config.ts
├── public/
│   └── leaflet/
│       ├── marker-icon.png
│       ├── marker-icon-2x.png
│       └── marker-shadow.png
└── src/
    ├── app/
    │   ├── globals.css                ← Sora+DM Sans fonts, blood-red CSS vars
    │   ├── layout.tsx                 ← root layout with ThemeProvider
    │   ├── page.tsx                   ← public landing page
    │   ├── (auth)/
    │   │   ├── layout.tsx
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   ├── auth/
    │   │   └── callback/route.ts      ← OAuth handler
    │   ├── (dashboard)/
    │   │   ├── layout.tsx             ← checks is_profile_complete
    │   │   ├── dashboard/page.tsx
    │   │   ├── profile/complete/page.tsx
    │   │   ├── requests/
    │   │   │   ├── page.tsx
    │   │   │   ├── new/page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   ├── donors/
    │   │   │   ├── page.tsx
    │   │   │   └── [id]/page.tsx
    │   │   ├── history/page.tsx
    │   │   ├── notifications/page.tsx
    │   │   ├── inventory/page.tsx
    │   │   └── admin/page.tsx
    │   └── api/
    │       ├── donors/nearby/route.ts
    │       └── notifications/send/route.ts
    ├── components/
    │   ├── ui/                        ← shadcn auto-generated
    │   ├── layout/
    │   │   ├── Navbar.tsx
    │   │   ├── Sidebar.tsx
    │   │   ├── MobileNav.tsx
    │   │   └── Footer.tsx
    │   ├── auth/
    │   │   ├── LoginForm.tsx
    │   │   ├── RegisterForm.tsx
    │   │   └── ProfileCompleteForm.tsx
    │   ├── shared/
    │   │   ├── BloodTypeBadge.tsx
    │   │   ├── UrgencyBadge.tsx
    │   │   ├── EligibilityBanner.tsx
    │   │   ├── LoadingSpinner.tsx
    │   │   └── EmptyState.tsx
    │   ├── requests/
    │   │   ├── RequestCard.tsx
    │   │   ├── RequestList.tsx
    │   │   ├── RequestForm.tsx
    │   │   ├── RequestDetail.tsx
    │   │   └── RequestFilters.tsx
    │   ├── donors/
    │   │   ├── DonorCard.tsx
    │   │   ├── DonorList.tsx
    │   │   ├── DonorFilters.tsx
    │   │   ├── DonorMap.tsx           ← dynamic() wrapper only
    │   │   └── MapInner.tsx           ← actual Leaflet code
    │   ├── dashboard/
    │   │   ├── StatsCard.tsx
    │   │   ├── RecentRequests.tsx
    │   │   ├── EligibilityBanner.tsx
    │   │   └── ActivityFeed.tsx
    │   └── notifications/
    │       └── NotificationBell.tsx
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts              ← browser client
    │   │   └── server.ts              ← server client
    │   ├── utils.ts
    │   ├── constants.ts
    │   └── validations.ts             ← all Zod schemas
    ├── hooks/
    │   ├── useUser.ts
    │   ├── useProfile.ts
    │   ├── useRequests.ts
    │   ├── useDonors.ts
    │   └── useNotifications.ts
    └── types/
        └── index.ts
```

---

## 5. Critical Files — Exact Content

### middleware.ts (ROOT level — not inside src/)
```typescript
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options))
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  const { pathname } = request.nextUrl

  const protectedPaths = ['/dashboard', '/profile', '/requests/new',
    '/donors', '/history', '/notifications', '/inventory', '/admin']

  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  if (isProtected && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  if ((pathname === '/login' || pathname === '/register') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### src/lib/supabase/client.ts
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### src/lib/supabase/server.ts
```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
```

### src/app/auth/callback/route.ts
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  if (code) {
    const supabase = createClient()
    await supabase.auth.exchangeCodeForSession(code)
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
```

### vercel.json (ROOT level)
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "installCommand": "pnpm install"
}
```

---

## 6. Database Schema (6 Tables)

If ANY of these tables are missing, create them in Supabase SQL Editor:

```sql
-- ENUMS
DO $$ BEGIN
  CREATE TYPE blood_type AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('donor','patient','hospital_staff','blood_bank_admin','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE request_status AS ENUM ('open','partially_fulfilled','fulfilled','cancelled','expired');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE response_status AS ENUM ('pending','accepted','rejected','completed','no_show');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE TYPE urgency_level AS ENUM ('critical','urgent','normal');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- TABLE 1: profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'donor',
  student_id TEXT,
  department TEXT,
  batch TEXT,
  contact_number TEXT,
  blood_type blood_type,
  present_address TEXT,
  present_district TEXT,
  present_division TEXT,
  permanent_address TEXT,
  permanent_district TEXT,
  permanent_division TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  is_eligible BOOLEAN DEFAULT TRUE,
  last_donation_date DATE,
  total_donations INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,
  avatar_url TEXT,
  bio TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 2: blood_requests
CREATE TABLE IF NOT EXISTS blood_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  blood_type blood_type NOT NULL,
  units_needed INTEGER NOT NULL DEFAULT 1,
  units_fulfilled INTEGER NOT NULL DEFAULT 0,
  urgency urgency_level NOT NULL DEFAULT 'urgent',
  status request_status NOT NULL DEFAULT 'open',
  hospital_name TEXT NOT NULL,
  hospital_address TEXT NOT NULL,
  district TEXT NOT NULL,
  division TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  contact_number TEXT NOT NULL,
  description TEXT,
  needed_before TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

-- TABLE 3: donor_responses
CREATE TABLE IF NOT EXISTS donor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status response_status NOT NULL DEFAULT 'pending',
  message TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(request_id, donor_id)
);

-- TABLE 4: donations
CREATE TABLE IF NOT EXISTS donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_id UUID REFERENCES blood_requests(id) ON DELETE SET NULL,
  response_id UUID REFERENCES donor_responses(id) ON DELETE SET NULL,
  hospital_name TEXT NOT NULL,
  blood_type blood_type NOT NULL,
  units_donated INTEGER NOT NULL DEFAULT 1,
  donated_at DATE NOT NULL DEFAULT CURRENT_DATE,
  certificate_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 5: notifications
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TABLE 6: blood_inventory
CREATE TABLE IF NOT EXISTS blood_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  managed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  blood_type blood_type NOT NULL,
  units_available INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(managed_by, blood_type)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_blood_type ON profiles(blood_type);
CREATE INDEX IF NOT EXISTS idx_profiles_district ON profiles(present_district);
CREATE INDEX IF NOT EXISTS idx_profiles_division ON profiles(present_division);
CREATE INDEX IF NOT EXISTS idx_profiles_eligible ON profiles(is_eligible, is_available);
CREATE INDEX IF NOT EXISTS idx_blood_requests_status ON blood_requests(status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_blood_type ON blood_requests(blood_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);

-- TRIGGERS
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS update_blood_requests_updated_at ON blood_requests;
CREATE TRIGGER update_blood_requests_updated_at
BEFORE UPDATE ON blood_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE OR REPLACE FUNCTION handle_donation_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    UPDATE profiles SET
      last_donation_date = CURRENT_DATE,
      is_eligible = FALSE,
      total_donations = total_donations + 1
    WHERE id = NEW.donor_id;
    INSERT INTO donations (donor_id, request_id, response_id, hospital_name, blood_type, units_donated, donated_at)
    SELECT NEW.donor_id, br.id, NEW.id, br.hospital_name, br.blood_type, 1, CURRENT_DATE
    FROM blood_requests br WHERE br.id = NEW.request_id;
    UPDATE blood_requests SET units_fulfilled = units_fulfilled + 1
    WHERE id = NEW.request_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_donor_response_completed ON donor_responses;
CREATE TRIGGER on_donor_response_completed
AFTER UPDATE ON donor_responses
FOR EACH ROW EXECUTE FUNCTION handle_donation_completed();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name',''), 'donor');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE OR REPLACE FUNCTION restore_donor_eligibility()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET is_eligible = TRUE
  WHERE is_eligible = FALSE
    AND last_donation_date IS NOT NULL
    AND last_donation_date <= CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES
DO $$ BEGIN
  CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Blood requests are public" ON blood_requests FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Authenticated users can create requests" ON blood_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Owners can update own requests" ON blood_requests FOR UPDATE USING (auth.uid() = requester_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Donors can see their responses" ON donor_responses FOR SELECT USING (auth.uid() = donor_id OR auth.uid() = (SELECT requester_id FROM blood_requests WHERE id = request_id));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Donors can create responses" ON donor_responses FOR INSERT WITH CHECK (auth.uid() = donor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Donors can update own responses" ON donor_responses FOR UPDATE USING (auth.uid() = donor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Donors can see own donations" ON donations FOR SELECT USING (auth.uid() = donor_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Inventory is public" ON blood_inventory FOR SELECT USING (TRUE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  CREATE POLICY "Managers can manage inventory" ON blood_inventory FOR ALL USING (auth.uid() = managed_by);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- STORAGE BUCKETS (run separately if needed)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',TRUE) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates','certificates',TRUE) ON CONFLICT DO NOTHING;
```

---

## 7. TypeScript Types (src/types/index.ts)

```typescript
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
export type UserRole = 'donor' | 'patient' | 'hospital_staff' | 'blood_bank_admin' | 'admin'
export type RequestStatus = 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired'
export type ResponseStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'no_show'
export type UrgencyLevel = 'critical' | 'urgent' | 'normal'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  student_id?: string
  department?: string
  batch?: string
  contact_number?: string
  blood_type?: BloodType
  present_address?: string
  present_district?: string
  present_division?: string
  permanent_address?: string
  permanent_district?: string
  permanent_division?: string
  latitude?: number
  longitude?: number
  is_eligible: boolean
  last_donation_date?: string
  total_donations: number
  is_available: boolean
  avatar_url?: string
  bio?: string
  is_profile_complete: boolean
  is_verified: boolean
  created_at: string
  updated_at: string
}

export interface BloodRequest {
  id: string
  requester_id: string
  patient_name: string
  blood_type: BloodType
  units_needed: number
  units_fulfilled: number
  urgency: UrgencyLevel
  status: RequestStatus
  hospital_name: string
  hospital_address: string
  district: string
  division: string
  latitude?: number
  longitude?: number
  contact_number: string
  description?: string
  needed_before?: string
  created_at: string
  updated_at: string
  expires_at: string
  profiles?: Profile
}

export interface DonorResponse {
  id: string
  request_id: string
  donor_id: string
  status: ResponseStatus
  message?: string
  responded_at: string
  completed_at?: string
  profiles?: Profile
  blood_requests?: BloodRequest
}

export interface Donation {
  id: string
  donor_id: string
  request_id?: string
  hospital_name: string
  blood_type: BloodType
  units_donated: number
  donated_at: string
  certificate_url?: string
  notes?: string
  created_at: string
}

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'emergency' | 'response' | 'system' | 'reminder'
  is_read: boolean
  link?: string
  created_at: string
}

export interface BloodInventory {
  id: string
  managed_by: string
  institution_name: string
  blood_type: BloodType
  units_available: number
  low_stock_threshold: number
  updated_at: string
}
```

---

## 8. Constants (src/lib/constants.ts)

```typescript
export const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'] as const

export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'O-':  ['O-','O+','A-','A+','B-','B+','AB-','AB+'],
  'O+':  ['O+','A+','B+','AB+'],
  'A-':  ['A-','A+','AB-','AB+'],
  'A+':  ['A+','AB+'],
  'B-':  ['B-','B+','AB-','AB+'],
  'B+':  ['B+','AB+'],
  'AB-': ['AB-','AB+'],
  'AB+': ['AB+'],
}

export const DIVISIONS_DISTRICTS: Record<string, string[]> = {
  Dhaka: ['Dhaka','Gazipur','Narayanganj','Narsingdi','Manikganj','Munshiganj','Faridpur','Gopalganj','Madaripur','Rajbari','Shariatpur','Kishoreganj','Netrokona','Mymensingh','Jamalpur','Sherpur','Tangail'],
  Chittagong: ['Chittagong',"Cox's Bazar",'Rangamati','Bandarban','Khagrachari','Feni','Lakshmipur','Noakhali','Comilla','Chandpur','Brahmanbaria'],
  Rajshahi: ['Rajshahi','Chapai Nawabganj','Natore','Naogaon','Bogra','Joypurhat','Pabna','Sirajganj'],
  Khulna: ['Khulna','Bagerhat','Satkhira','Jessore','Narail','Magura','Jhenaidah','Kushtia','Chuadanga','Meherpur'],
  Barisal: ['Barisal','Bhola','Patuakhali','Barguna','Pirojpur','Jhalokati'],
  Sylhet: ['Sylhet','Moulvibazar','Habiganj','Sunamganj'],
  Rangpur: ['Rangpur','Gaibandha','Kurigram','Lalmonirhat','Nilphamari','Panchagarh','Thakurgaon','Dinajpur'],
  Mymensingh: ['Mymensingh','Jamalpur','Sherpur','Netrokona'],
}

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'English','Economics','Mathematics',
  'Physics','Chemistry','Law','Pharmacy',
  'Architecture','Agriculture','Other',
]

export const URGENCY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-600 text-white', icon: '🚨' },
  urgent:   { label: 'Urgent',   color: 'bg-orange-500 text-white', icon: '⚠️' },
  normal:   { label: 'Normal',   color: 'bg-blue-500 text-white', icon: 'ℹ️' },
}

export const BLOOD_TYPE_COLORS: Record<string, string> = {
  'A+': 'bg-red-100 text-red-800 border-red-200',
  'A-': 'bg-red-200 text-red-900 border-red-300',
  'B+': 'bg-orange-100 text-orange-800 border-orange-200',
  'B-': 'bg-orange-200 text-orange-900 border-orange-300',
  'AB+': 'bg-purple-100 text-purple-800 border-purple-200',
  'AB-': 'bg-purple-200 text-purple-900 border-purple-300',
  'O+': 'bg-green-100 text-green-800 border-green-200',
  'O-': 'bg-green-200 text-green-900 border-green-300',
}

export const DONATION_COOLDOWN_DAYS = 90
```

---

## 9. Design System

### Colors
- Primary red: `#C41E3A`
- Dark red: `#8B0000`
- Light red bg: `#FFE4E8`
- Muted red bg: `#FFF0F2`

### Fonts
- Headings (`h1`–`h6`): **Sora** from Google Fonts
- Body text: **DM Sans** from Google Fonts
- NEVER use Inter, Arial, or system fonts

### globals.css must include:
```css
@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');

:root {
  --primary: 0 75% 42%;
  --blood-red: #C41E3A;
  --blood-dark: #8B0000;
  --blood-light: #FFE4E8;
}
```

### tailwind.config.ts must include:
```typescript
colors: {
  blood: {
    DEFAULT: '#C41E3A',
    dark: '#8B0000',
    light: '#FFE4E8',
    muted: '#FFF0F2',
  }
},
fontFamily: {
  sans: ['DM Sans', 'sans-serif'],
  display: ['Sora', 'sans-serif'],
},
```

---

## 10. Page Specifications

### Landing Page (src/app/page.tsx) — PUBLIC
Sections in order:
1. **Hero** — blood-gradient background, "Every Drop Counts" headline, pulse animation on blood drop icon, two CTAs: "Find a Donor" + "Register as Donor"
2. **Stats Bar** — live Supabase counts: Total Donors, Donations, Districts Covered
3. **How It Works** — 3 steps with icons
4. **Blood Type Compatibility** — 8-cell grid showing donor compatibility
5. **Recent Critical Requests** — 3 most recent `status='open'` + `urgency='critical'` requests from Supabase
6. **Footer** — logo, tagline, links

### Login Page (src/app/(auth)/login/page.tsx)
- Email + Password fields
- "Continue with Google" button → Supabase OAuth
- Link to /register

### Register Page (src/app/(auth)/register/page.tsx)
- Full Name, Email, Password, Confirm Password
- "Continue with Google" button
- After submit → redirect to /profile/complete

### Profile Complete (src/app/(dashboard)/profile/complete/page.tsx) ⭐ MOST CRITICAL
ALL fields required:
- full_name, student_id, department (select), batch (select 2019–2025)
- blood_type (select with 8 options), contact_number
- present_address (textarea), present_district (select), present_division (select)
- permanent_address, permanent_district, permanent_division
- "Same as present address" checkbox that auto-fills permanent fields
- bio (optional, 300 chars)
- avatar upload → Supabase Storage avatars bucket

On submit: UPDATE profiles SET is_profile_complete = TRUE → redirect to /dashboard

**Dashboard layout MUST redirect to /profile/complete if is_profile_complete = false.**

### Dashboard (src/app/(dashboard)/dashboard/page.tsx)
Role-aware content:

**Donor role:**
- EligibilityBanner (green if eligible, amber with countdown if not)
- is_available toggle switch
- Stats: total donations, blood type, days since last donation
- 5 recent open requests matching donor's blood type in their division

**Patient role:**
- "Post Emergency Request" CTA
- My active requests list with donor response count

**Hospital/Blood Bank:**
- Blood inventory summary grid
- Recent requests in their district

**Admin:**
- Platform stats, pending verifications

### Blood Requests List (src/app/(dashboard)/requests/page.tsx)
Filters: blood_type, urgency, division, district, status
Show RequestCard with: UrgencyBadge, BloodTypeBadge, hospital, district, time ago, respond button

### New Request (src/app/(dashboard)/requests/new/page.tsx)
3-step form:
- Step 1: patient_name, blood_type, units_needed (1–10), urgency, needed_before
- Step 2: hospital_name, hospital_address, district, division
- Step 3: contact_number, description, review + submit

### Request Detail (src/app/(dashboard)/requests/[id]/page.tsx)
- Full request info + Leaflet map (dynamic import ssr:false)
- Pulsing animation for critical urgency
- "Respond as Donor" button → modal with optional message
- List of donor responses with status badges

### Donor Directory (src/app/(dashboard)/donors/page.tsx)
- Toggle: List View / Map View
- Filters: blood_type, division, district, department, batch
- Contact number visible only to authenticated users
- Map: React-Leaflet with custom blood-red markers

### History (src/app/(dashboard)/history/page.tsx)
3 tabs: My Donations | My Requests | My Responses

### Notifications (src/app/(dashboard)/notifications/page.tsx)
- Real-time via Supabase Realtime subscription
- Mark all as read button
- Unread highlighted

### Inventory (src/app/(dashboard)/inventory/page.tsx)
- Role guard: hospital_staff or blood_bank_admin only
- 8 blood type cards with +/- buttons
- Red glow when below threshold

### Admin Panel (src/app/(dashboard)/admin/page.tsx)
- Role guard: admin only
- Users table with role management
- Pending verifications queue
- Charts with recharts

---

## 11. Leaflet Map — Critical Implementation

**NEVER import Leaflet at top level. It crashes Next.js SSR.**

### DonorMap.tsx (wrapper — no direct Leaflet imports)
```typescript
'use client'
import dynamic from 'next/dynamic'
import type { Profile } from '@/types'

const MapInner = dynamic(() => import('./MapInner'), {
  ssr: false,
  loading: () => <div className="h-96 bg-muted animate-pulse rounded-xl" />
})

export default function DonorMap({ donors }: { donors: Profile[] }) {
  return <MapInner donors={donors} />
}
```

### MapInner.tsx (actual Leaflet code)
```typescript
'use client'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { Profile } from '@/types'

delete (L.Icon.Default.prototype as { _getIconUrl?: unknown })._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

export default function MapInner({ donors }: { donors: Profile[] }) {
  const valid = donors.filter(d => d.latitude && d.longitude)
  const center: [number, number] = valid.length > 0
    ? [valid[0].latitude!, valid[0].longitude!]
    : [23.8103, 90.4125]

  return (
    <MapContainer center={center} zoom={10} className="h-96 w-full rounded-xl z-0">
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {valid.map(donor => (
        <Marker key={donor.id} position={[donor.latitude!, donor.longitude!]}>
          <Popup>
            <p className="font-semibold">{donor.full_name}</p>
            <p className="text-red-600 font-bold">{donor.blood_type}</p>
            <p>{donor.present_district}</p>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

Copy leaflet assets:
```bash
cp node_modules/leaflet/dist/images/* public/leaflet/
```

---

## 12. Zod Validation Schemas (src/lib/validations.ts)

```typescript
import { z } from 'zod'

const BLOOD_TYPES = ['A+','A-','B+','B-','AB+','AB-','O+','O-'] as const
const DIVISIONS = ['Dhaka','Chittagong','Rajshahi','Khulna','Barisal','Sylhet','Rangpur','Mymensingh'] as const

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(2),
})

export const profileCompleteSchema = z.object({
  full_name: z.string().min(2),
  student_id: z.string().min(1),
  department: z.string().min(1),
  batch: z.string().min(4),
  blood_type: z.enum(BLOOD_TYPES),
  contact_number: z.string().regex(/^(\+88)?01[3-9]\d{8}$/),
  present_address: z.string().min(10),
  present_district: z.string().min(1),
  present_division: z.enum(DIVISIONS),
  permanent_address: z.string().min(10),
  permanent_district: z.string().min(1),
  permanent_division: z.enum(DIVISIONS),
  bio: z.string().max(300).optional(),
})

export const bloodRequestSchema = z.object({
  patient_name: z.string().min(2),
  blood_type: z.enum(BLOOD_TYPES),
  units_needed: z.number().int().min(1).max(10),
  urgency: z.enum(['critical','urgent','normal']),
  hospital_name: z.string().min(2),
  hospital_address: z.string().min(10),
  district: z.string().min(1),
  division: z.enum(DIVISIONS),
  contact_number: z.string().regex(/^(\+88)?01[3-9]\d{8}$/),
  description: z.string().max(500).optional(),
  needed_before: z.string().optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileCompleteInput = z.infer<typeof profileCompleteSchema>
export type BloodRequestInput = z.infer<typeof bloodRequestSchema>
```

---

## 13. API Routes

### src/app/api/donors/nearby/route.ts
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const bloodType = searchParams.get('blood_type')
  const division = searchParams.get('division')
  const district = searchParams.get('district')

  const supabase = createClient()
  let query = supabase
    .from('profiles')
    .select('*')
    .eq('is_eligible', true)
    .eq('is_available', true)
    .eq('is_profile_complete', true)
    .eq('role', 'donor')

  if (bloodType) query = query.eq('blood_type', bloodType)
  if (division) query = query.eq('present_division', division)
  if (district) query = query.eq('present_district', district)

  const { data, error } = await query.limit(50)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ donors: data })
}
```

### src/app/api/notifications/send/route.ts
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { user_ids, title, message, type, link } = await req.json()
  const supabase = createClient()
  const rows = (user_ids as string[]).map(id => ({ user_id: id, title, message, type, link }))
  const { error } = await supabase.from('notifications').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

---

## 14. Absolute Rules — Never Violate These

```
✅ DO:
- Use App Router (src/app/) only
- Use pnpm for all commands
- Use TypeScript strict — proper types from src/types/index.ts
- Use Sora font for headings, DM Sans for body
- Use #C41E3A as primary blood red color
- Use react-hook-form + zod for ALL forms
- Use server components by default
- Import Leaflet ONLY via dynamic() with ssr:false
- Use createClient from server.ts in server components
- Use createClient from client.ts in client components

❌ NEVER DO:
- Use `any` TypeScript type
- Import leaflet at top level (SSR crash)
- Use localStorage for auth state
- Expose SUPABASE_SERVICE_ROLE_KEY in client components
- Use Inter or Arial fonts
- Use pages/ router
- Use npm or yarn
- Skip the profile complete redirect in dashboard layout
- Create empty placeholder pages — always implement fully
```

---

## 15. Automated Task Execution Order

When you finish reading this file, execute these tasks automatically:

### TASK 1 — Audit
```bash
pnpm tsc --noEmit 2>&1 | tee /tmp/ts-errors.txt
pnpm lint 2>&1 | tee /tmp/lint-errors.txt
pnpm build 2>&1 | tee /tmp/build-errors.txt
```

### TASK 2 — Fix All Errors
Read each error file and fix every issue. Re-run until zero errors.

### TASK 3 — Check Missing Files
For each file listed in Section 4 that doesn't exist, create it fully.

### TASK 4 — Check Leaflet Assets
```bash
ls public/leaflet/
# If missing any .png files:
cp node_modules/leaflet/dist/images/* public/leaflet/
```

### TASK 5 — Final Build Verification
```bash
pnpm tsc --noEmit  # must show 0 errors
pnpm lint          # must show 0 errors
pnpm build         # must show ✓ Compiled successfully
```

### TASK 6 — Push to GitHub
```bash
git add -A
git commit -m "fix: complete audit, all errors resolved, spec compliant"
git push origin main
```

### TASK 7 — Report
After pushing, output a full report:
- List every file created or modified
- List every error found and fixed
- List any items needing manual action in Supabase/Vercel
- Confirm build status: PASSING or FAILING

---

## 16. Manual Actions Required (Cannot Be Done by Code Agent)

These must be done by the human in browser:

1. **Supabase SQL** — Run the full SQL from Section 6 in Supabase SQL Editor
2. **Storage Buckets** — Create `avatars` and `certificates` buckets in Supabase Storage
3. **Auth Redirect URL** — Add `https://blood-link-blush.vercel.app/auth/callback` in Supabase → Auth → URL Configuration
4. **Google OAuth** — Enable Google provider in Supabase → Auth → Providers with Google OAuth credentials
5. **Vercel Env Vars** — Confirm all 5 variables exist in Vercel → Settings → Environment Variables
6. **pg_cron** — Enable in Supabase → Database → Extensions, then schedule: `SELECT cron.schedule('restore-eligibility','0 0 * * *','SELECT restore_donor_eligibility()');`

---

*End of CLAUDE.md — Start executing Task 1 immediately.*
