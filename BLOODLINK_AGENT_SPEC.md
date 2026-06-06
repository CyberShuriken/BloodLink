# BloodLink — Full-Stack Web Application
## Complete Agent Specification & Build Guide

> **Read this entire file before writing a single line of code.**
> This document is the single source of truth. Follow every section in order.
> When in doubt, re-read this file. Do not make assumptions.

---

## 0. Project Summary

**BloodLink** is a responsive full-stack web application that connects blood donors, patients, hospitals, and blood banks into one coordinated network. University students register with their profile data (department, batch, blood type, location) so the system can match emergency blood requests to nearby eligible donors instantly.

### Core Stack (Non-Negotiable)
| Layer | Technology |
|---|---|
| Framework | **Next.js 14** (App Router) |
| Language | **TypeScript** (strict mode) |
| Styling | **Tailwind CSS** + **shadcn/ui** |
| Backend / Database | **Supabase** (PostgreSQL) |
| Authentication | **Supabase Auth** (Email + Google OAuth) |
| File Storage | **Supabase Storage** |
| Maps | **Leaflet.js** + **React-Leaflet** (no API key needed) |
| Real-time | **Supabase Realtime** (for live request updates) |
| Email | **Supabase Edge Functions** + **Resend** (free tier) |
| Deployment | **Vercel** (connected to GitHub repo) |
| Package Manager | **pnpm** |

---

## 1. Repository & Project Setup

### 1.1 Initialize Project
```bash
pnpm create next-app@latest bloodlink --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd bloodlink
```

### 1.2 Install All Dependencies
```bash
# UI & Styling
pnpm add @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-select
pnpm add @radix-ui/react-toast @radix-ui/react-avatar @radix-ui/react-badge
pnpm add class-variance-authority clsx tailwind-merge lucide-react
pnpm add tailwindcss-animate

# Supabase
pnpm add @supabase/supabase-js @supabase/ssr @supabase/auth-helpers-nextjs

# Forms & Validation
pnpm add react-hook-form @hookform/resolvers zod

# Maps
pnpm add leaflet react-leaflet
pnpm add -D @types/leaflet

# Utilities
pnpm add date-fns sonner next-themes
```

### 1.3 shadcn/ui Setup
```bash
pnpm dlx shadcn-ui@latest init
# Choose: Default style, Slate base color, CSS variables yes
pnpm dlx shadcn-ui@latest add button card input label select textarea badge avatar
pnpm dlx shadcn-ui@latest add dialog sheet dropdown-menu toast separator skeleton
pnpm dlx shadcn-ui@latest add form table tabs alert
```

### 1.4 Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=your_resend_api_key
```

Create `.env.example` with the same keys but empty values. Commit `.env.example`, NEVER commit `.env.local`.

Add to `.gitignore`:
```
.env.local
.env.*.local
```

---

## 2. Supabase Project Setup

### 2.1 Create Supabase Project
1. Go to https://supabase.com → New Project
2. Save the project URL and anon key to `.env.local`
3. Go to Authentication → Providers → Enable **Email** and **Google**
4. For Google: create OAuth credentials at console.cloud.google.com, add the Supabase callback URL

### 2.2 Authentication Settings (Supabase Dashboard)
- Email confirmations: **ON**
- Redirect URLs: add `http://localhost:3000/auth/callback` and `https://your-vercel-domain.vercel.app/auth/callback`
- Go to Auth → Email Templates → customize the confirmation email with BloodLink branding

---

## 3. Complete Database Schema

Run this SQL in Supabase SQL Editor **in order**. Do not skip any step.

```sql
-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE user_role AS ENUM ('donor', 'patient', 'hospital_staff', 'blood_bank_admin', 'admin');
CREATE TYPE request_status AS ENUM ('open', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired');
CREATE TYPE response_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'no_show');
CREATE TYPE urgency_level AS ENUM ('critical', 'urgent', 'normal');

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'donor',

  -- Student/Donor specific fields
  student_id TEXT,
  department TEXT,
  batch TEXT,               -- e.g. "2021", "2022"
  contact_number TEXT,
  blood_type blood_type,

  -- Address
  present_address TEXT,
  present_district TEXT,
  present_division TEXT,
  permanent_address TEXT,
  permanent_district TEXT,
  permanent_division TEXT,

  -- Coordinates for geo-matching (from present address)
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,

  -- Donor status
  is_eligible BOOLEAN DEFAULT TRUE,
  last_donation_date DATE,
  total_donations INTEGER DEFAULT 0,
  is_available BOOLEAN DEFAULT TRUE,  -- donor can toggle off availability

  -- Profile
  avatar_url TEXT,
  bio TEXT,
  is_profile_complete BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,  -- admin verifies hospital/blood bank accounts

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BLOOD REQUESTS
-- ============================================================
CREATE TABLE blood_requests (
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

-- ============================================================
-- DONOR RESPONSES
-- ============================================================
CREATE TABLE donor_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
  donor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status response_status NOT NULL DEFAULT 'pending',
  message TEXT,
  responded_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(request_id, donor_id)
);

-- ============================================================
-- DONATIONS (completed donation records)
-- ============================================================
CREATE TABLE donations (
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

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL,  -- 'emergency', 'response', 'system', 'reminder'
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,           -- optional route to navigate to
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- BLOOD INVENTORY (for hospital/blood bank accounts)
-- ============================================================
CREATE TABLE blood_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  managed_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  institution_name TEXT NOT NULL,
  blood_type blood_type NOT NULL,
  units_available INTEGER NOT NULL DEFAULT 0,
  low_stock_threshold INTEGER NOT NULL DEFAULT 5,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(managed_by, blood_type)
);

-- ============================================================
-- INDEXES (for performance)
-- ============================================================
CREATE INDEX idx_profiles_blood_type ON profiles(blood_type);
CREATE INDEX idx_profiles_district ON profiles(present_district);
CREATE INDEX idx_profiles_division ON profiles(present_division);
CREATE INDEX idx_profiles_eligible ON profiles(is_eligible, is_available);
CREATE INDEX idx_blood_requests_status ON blood_requests(status);
CREATE INDEX idx_blood_requests_blood_type ON blood_requests(blood_type);
CREATE INDEX idx_blood_requests_district ON blood_requests(district);
CREATE INDEX idx_donor_responses_donor ON donor_responses(donor_id);
CREATE INDEX idx_donor_responses_request ON donor_responses(request_id);
CREATE INDEX idx_notifications_user ON notifications(user_id, is_read);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_blood_requests_updated_at BEFORE UPDATE ON blood_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- DONOR ELIGIBILITY AUTO-UPDATE
-- After a donation is confirmed, update donor's last_donation_date
-- and set is_eligible = false for 90 days
-- ============================================================
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

CREATE TRIGGER on_donor_response_completed
AFTER UPDATE ON donor_responses
FOR EACH ROW EXECUTE FUNCTION handle_donation_completed();

-- ============================================================
-- ELIGIBILITY RESTORE (run as a scheduled job or cron)
-- Re-enables donors after 90 days
-- ============================================================
CREATE OR REPLACE FUNCTION restore_donor_eligibility()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET is_eligible = TRUE
  WHERE is_eligible = FALSE
    AND last_donation_date IS NOT NULL
    AND last_donation_date <= CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory ENABLE ROW LEVEL SECURITY;

-- Profiles: public read, own write
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Blood requests: public read, authenticated create, own update
CREATE POLICY "Blood requests are public" ON blood_requests FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create requests" ON blood_requests FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Owners can update own requests" ON blood_requests FOR UPDATE USING (auth.uid() = requester_id);

-- Donor responses: authenticated
CREATE POLICY "Donors can see their responses" ON donor_responses FOR SELECT USING (auth.uid() = donor_id OR auth.uid() = (SELECT requester_id FROM blood_requests WHERE id = request_id));
CREATE POLICY "Donors can create responses" ON donor_responses FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors can update own responses" ON donor_responses FOR UPDATE USING (auth.uid() = donor_id);

-- Donations: own read
CREATE POLICY "Donors can see own donations" ON donations FOR SELECT USING (auth.uid() = donor_id);

-- Notifications: own only
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Inventory: public read, own write
CREATE POLICY "Inventory is public" ON blood_inventory FOR SELECT USING (TRUE);
CREATE POLICY "Managers can manage inventory" ON blood_inventory FOR ALL USING (auth.uid() = managed_by);

-- ============================================================
-- NEW USER TRIGGER (creates profile row on signup)
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'donor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### 3.1 Supabase Storage Bucket
```sql
-- Run in SQL editor
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', TRUE);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE);

CREATE POLICY "Anyone can view avatars" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth users can upload avatars" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view certificates" ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
```

---

## 4. Project File Structure

```
bloodlink/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── register/page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx
│   │   │   ├── profile/page.tsx
│   │   │   ├── profile/complete/page.tsx      ← onboarding form
│   │   │   ├── requests/page.tsx
│   │   │   ├── requests/[id]/page.tsx
│   │   │   ├── requests/new/page.tsx
│   │   │   ├── donors/page.tsx
│   │   │   ├── donors/[id]/page.tsx
│   │   │   ├── history/page.tsx
│   │   │   ├── notifications/page.tsx
│   │   │   ├── inventory/page.tsx             ← hospital/blood bank only
│   │   │   ├── admin/page.tsx                 ← admin only
│   │   │   └── layout.tsx
│   │   ├── auth/
│   │   │   └── callback/route.ts              ← OAuth callback handler
│   │   ├── api/
│   │   │   ├── donors/nearby/route.ts
│   │   │   └── notifications/send/route.ts
│   │   ├── layout.tsx
│   │   ├── page.tsx                           ← public landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                                ← shadcn components (auto-generated)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MobileNav.tsx
│   │   │   └── Footer.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProfileCompleteForm.tsx
│   │   ├── requests/
│   │   │   ├── RequestCard.tsx
│   │   │   ├── RequestList.tsx
│   │   │   ├── RequestForm.tsx
│   │   │   ├── RequestDetail.tsx
│   │   │   └── RequestFilters.tsx
│   │   ├── donors/
│   │   │   ├── DonorCard.tsx
│   │   │   ├── DonorList.tsx
│   │   │   ├── DonorFilters.tsx
│   │   │   └── DonorMap.tsx                   ← Leaflet map
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── RecentRequests.tsx
│   │   │   ├── EligibilityBanner.tsx
│   │   │   └── ActivityFeed.tsx
│   │   ├── notifications/
│   │   │   └── NotificationBell.tsx
│   │   └── shared/
│   │       ├── BloodTypeBadge.tsx
│   │       ├── UrgencyBadge.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── EmptyState.tsx
│   │       └── ConfirmDialog.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                      ← browser client
│   │   │   ├── server.ts                      ← server client
│   │   │   └── middleware.ts
│   │   ├── utils.ts
│   │   ├── constants.ts
│   │   └── validations.ts                     ← all Zod schemas
│   ├── hooks/
│   │   ├── useUser.ts
│   │   ├── useProfile.ts
│   │   ├── useRequests.ts
│   │   ├── useDonors.ts
│   │   └── useNotifications.ts
│   └── types/
│       ├── database.ts                        ← generated from Supabase
│       └── index.ts
├── middleware.ts                              ← route protection
├── next.config.js
├── tailwind.config.ts
└── .env.local
```

---

## 5. Supabase Client Setup

### `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### `src/lib/supabase/server.ts`
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

### `middleware.ts` (root level)
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

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard') ||
      pathname.startsWith('/profile') ||
      pathname.startsWith('/requests/new') ||
      pathname.startsWith('/donors') ||
      pathname.startsWith('/history') ||
      pathname.startsWith('/notifications') ||
      pathname.startsWith('/inventory') ||
      pathname.startsWith('/admin')) {
    if (!user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === '/login' || pathname === '/register') && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

### `src/app/auth/callback/route.ts`
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

---

## 6. Type Definitions

### `src/types/index.ts`
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
  profiles?: Profile  // joined
}

export interface DonorResponse {
  id: string
  request_id: string
  donor_id: string
  status: ResponseStatus
  message?: string
  responded_at: string
  completed_at?: string
  profiles?: Profile  // joined
  blood_requests?: BloodRequest  // joined
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

## 7. Zod Validation Schemas

### `src/lib/validations.ts`
```typescript
import { z } from 'zod'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
const DIVISIONS = ['Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barisal', 'Sylhet', 'Rangpur', 'Mymensingh'] as const

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
})

export const profileCompleteSchema = z.object({
  full_name: z.string().min(2),
  student_id: z.string().min(1, 'Student ID is required'),
  department: z.string().min(1, 'Department is required'),
  batch: z.string().min(4, 'Batch year is required'),
  blood_type: z.enum(BLOOD_TYPES, { required_error: 'Blood type is required' }),
  contact_number: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid Bangladeshi phone number'),
  present_address: z.string().min(10, 'Please enter a complete present address'),
  present_district: z.string().min(1, 'District is required'),
  present_division: z.enum(DIVISIONS, { required_error: 'Division is required' }),
  permanent_address: z.string().min(10, 'Please enter a complete permanent address'),
  permanent_district: z.string().min(1, 'District is required'),
  permanent_division: z.enum(DIVISIONS, { required_error: 'Division is required' }),
  bio: z.string().max(300).optional(),
})

export const bloodRequestSchema = z.object({
  patient_name: z.string().min(2, 'Patient name is required'),
  blood_type: z.enum(BLOOD_TYPES, { required_error: 'Blood type is required' }),
  units_needed: z.number().int().min(1).max(10),
  urgency: z.enum(['critical', 'urgent', 'normal']),
  hospital_name: z.string().min(2, 'Hospital name is required'),
  hospital_address: z.string().min(10, 'Full hospital address required'),
  district: z.string().min(1, 'District is required'),
  division: z.enum(DIVISIONS),
  contact_number: z.string().regex(/^(\+88)?01[3-9]\d{8}$/, 'Invalid phone number'),
  description: z.string().max(500).optional(),
  needed_before: z.string().optional(),
})

export const donorResponseSchema = z.object({
  message: z.string().max(300).optional(),
})

export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileCompleteInput = z.infer<typeof profileCompleteSchema>
export type BloodRequestInput = z.infer<typeof bloodRequestSchema>
export type DonorResponseInput = z.infer<typeof donorResponseSchema>
```

---

## 8. Constants

### `src/lib/constants.ts`
```typescript
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const

export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'O-':  ['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'],
  'O+':  ['O+', 'A+', 'B+', 'AB+'],
  'A-':  ['A-', 'A+', 'AB-', 'AB+'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B-', 'B+', 'AB-', 'AB+'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB-', 'AB+'],
  'AB+': ['AB+'],
}

export const DIVISIONS_DISTRICTS: Record<string, string[]> = {
  Dhaka: ['Dhaka', 'Gazipur', 'Narayanganj', 'Narsingdi', 'Manikganj', 'Munshiganj', 'Faridpur', 'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur', 'Kishoreganj', 'Netrokona', 'Mymensingh', 'Jamalpur', 'Sherpur', 'Tangail'],
  Chittagong: ['Chittagong', 'Cox\'s Bazar', 'Rangamati', 'Bandarban', 'Khagrachari', 'Feni', 'Lakshmipur', 'Noakhali', 'Comilla', 'Chandpur', 'Brahmanbaria'],
  Rajshahi: ['Rajshahi', 'Chapai Nawabganj', 'Natore', 'Naogaon', 'Bogra', 'Joypurhat', 'Pabna', 'Sirajganj'],
  Khulna: ['Khulna', 'Bagerhat', 'Satkhira', 'Jessore', 'Narail', 'Magura', 'Jhenaidah', 'Kushtia', 'Chuadanga', 'Meherpur'],
  Barisal: ['Barisal', 'Bhola', 'Patuakhali', 'Barguna', 'Pirojpur', 'Jhalokati'],
  Sylhet: ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  Rangpur: ['Rangpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat', 'Nilphamari', 'Panchagarh', 'Thakurgaon', 'Dinajpur'],
  Mymensingh: ['Mymensingh', 'Jamalpur', 'Sherpur', 'Netrokona'],
}

export const DEPARTMENTS = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Civil Engineering',
  'Mechanical Engineering',
  'Business Administration',
  'English',
  'Economics',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Law',
  'Pharmacy',
  'Architecture',
  'Agriculture',
  'Other',
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

## 9. Design System & Theme

### `src/app/globals.css`
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&display=swap');

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 224 71% 4%;
    --card: 0 0% 100%;
    --card-foreground: 224 71% 4%;
    --popover: 0 0% 100%;
    --popover-foreground: 224 71% 4%;
    --primary: 0 75% 42%;         /* Deep blood red: #C41E3A */
    --primary-foreground: 0 0% 100%;
    --secondary: 0 30% 96%;
    --secondary-foreground: 0 50% 25%;
    --muted: 220 14% 96%;
    --muted-foreground: 220 9% 46%;
    --accent: 0 75% 42%;
    --accent-foreground: 0 0% 100%;
    --destructive: 0 84% 60%;
    --destructive-foreground: 0 0% 100%;
    --border: 220 13% 91%;
    --input: 220 13% 91%;
    --ring: 0 75% 42%;
    --radius: 0.75rem;

    --blood-red: #C41E3A;
    --blood-dark: #8B0000;
    --blood-light: #FFE4E8;
    --blood-muted: #FFF0F2;
  }

  .dark {
    --background: 224 71% 4%;
    --foreground: 213 31% 91%;
    --card: 224 71% 6%;
    --card-foreground: 213 31% 91%;
    --primary: 0 72% 55%;
    --primary-foreground: 0 0% 100%;
    --secondary: 222 47% 11%;
    --secondary-foreground: 213 31% 91%;
    --muted: 223 47% 11%;
    --muted-foreground: 215 16% 57%;
    --border: 216 34% 17%;
    --input: 216 34% 17%;
  }

  * { @apply border-border; }
  body {
    @apply bg-background text-foreground;
    font-family: 'DM Sans', sans-serif;
  }
  h1, h2, h3, h4, h5, h6 {
    font-family: 'Sora', sans-serif;
  }
}

@layer utilities {
  .blood-gradient {
    background: linear-gradient(135deg, #C41E3A 0%, #8B0000 100%);
  }
  .blood-gradient-soft {
    background: linear-gradient(135deg, #FFE4E8 0%, #FFF0F2 100%);
  }
  .glass {
    backdrop-filter: blur(12px);
    background: rgba(255, 255, 255, 0.8);
    border: 1px solid rgba(255, 255, 255, 0.5);
  }
  .card-hover {
    @apply transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5;
  }
  .text-blood { color: #C41E3A; }
  .bg-blood { background-color: #C41E3A; }
  .border-blood { border-color: #C41E3A; }
  .pulse-ring {
    animation: pulse-ring 1.5s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
  }
  @keyframes pulse-ring {
    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(196, 30, 58, 0.4); }
    70% { transform: scale(1); box-shadow: 0 0 0 10px rgba(196, 30, 58, 0); }
    100% { transform: scale(0.95); }
  }
}
```

### `tailwind.config.ts`
```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'sans-serif'],
        display: ['Sora', 'sans-serif'],
      },
      colors: {
        blood: {
          DEFAULT: '#C41E3A',
          dark: '#8B0000',
          light: '#FFE4E8',
          muted: '#FFF0F2',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(10px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
      }
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
```

---

## 10. Page-by-Page Specification

### 10.1 Public Landing Page (`/`)
**Purpose:** Convert visitors to sign up. No login required.

**Sections (top to bottom):**
1. **Hero** — Full-width section with blood-gradient background. Headline: "Every Drop Counts." Subheadline: "Connect with nearby student donors in seconds during emergencies." Two CTAs: "Find a Donor" (→ /donors) and "Register as Donor" (→ /register). Animated pulse ring on a blood drop SVG icon.
2. **Stats Bar** — Live counts pulled from Supabase: Total Donors, Donations Completed, Districts Covered, Lives Saved (estimated). Animate numbers counting up on scroll.
3. **How It Works** — 3-step process with icons: (1) Post Emergency Request, (2) We Match Nearby Donors, (3) Donor Responds & Saves a Life.
4. **Blood Type Compatibility Chart** — Visual grid showing which blood types can donate to which.
5. **Urgency Banner** — Show the 3 most recent `critical` open requests publicly (name + blood type + district only). CTA to see all.
6. **Testimonials** — Static placeholder cards (3 testimonials with avatar, name, department).
7. **CTA Section** — "Join 500+ student donors" with register button.
8. **Footer** — Logo, tagline, links (About, Privacy, Terms), social icons.

### 10.2 Authentication Pages (`/login`, `/register`)

**`/register` form fields:**
- Full Name
- Email
- Password + Confirm Password
- OR "Continue with Google" button

**After registration:**
- Supabase sends confirmation email
- Redirect to `/profile/complete` with a banner: "Please complete your profile to start donating"

**`/login`:**
- Email + Password
- "Continue with Google"
- Forgot password link → Supabase handles password reset email

### 10.3 Profile Complete Page (`/profile/complete`) ⭐ CRITICAL
**This page is shown once after first login. Block access to all other dashboard pages until `is_profile_complete = true`.**

**Check in middleware AND in dashboard layout:**
```typescript
// In dashboard layout.tsx server component
const { data: profile } = await supabase.from('profiles').select('is_profile_complete').single()
if (!profile?.is_profile_complete && pathname !== '/profile/complete') {
  redirect('/profile/complete')
}
```

**Form fields (all required unless noted):**
- Full Name (pre-filled from auth)
- Student ID (text)
- Department (select from DEPARTMENTS constant)
- Batch/Year (select: current year minus 5 to current year)
- Blood Type (select with visual blood type icons)
- Contact Number (with +880 prefix hint)
- **Present Address section:**
  - Street Address (textarea)
  - District (select, filtered by division)
  - Division (select from DIVISIONS_DISTRICTS)
- **Permanent Address section:**
  - Same as present address checkbox (auto-fill if checked)
  - Street Address
  - District
  - Division
- Bio / About (optional, 300 chars max with counter)
- Profile Photo upload (Supabase Storage → avatars bucket)

**On submit:**
- Update `profiles` table
- Set `is_profile_complete = true`
- Redirect to `/dashboard`

### 10.4 Dashboard (`/dashboard`)
**Role-aware: shows different cards based on user role.**

**For Donors:**
- **Eligibility Banner** — If `is_eligible = false`: red banner with countdown to next eligible date (last_donation_date + 90 days). If eligible: green banner "You are eligible to donate!"
- **Stats Row:** Total Donations | Days Since Last Donation | Requests Responded To | Blood Type
- **Availability Toggle** — "Available to Donate" switch (updates `is_available` in profiles)
- **Recent Emergency Requests** — 5 most recent open requests matching the donor's blood type in their division. Each card has "Respond" button.
- **My Recent Responses** — List of requests the donor has responded to with status badges.

**For Patients/General Users:**
- **Quick Request Button** — Prominent "Post Emergency Request" CTA
- **My Active Requests** — Status tracker for their open requests with donor response count.
- **Recent Activity** — Timeline of events on their requests.

**For Hospital Staff / Blood Bank Admin:**
- **Inventory Summary** — Grid of 8 blood types with current unit counts. Red if below threshold.
- **Recent Requests** — Requests from their district/area.
- **Quick Inventory Update** buttons per blood type.

**For Admin:**
- **Platform Stats** — All users, total requests, pending verifications.
- **Pending Verifications** — List of hospital/blood bank accounts awaiting verification.

### 10.5 Blood Requests List (`/requests`)
**Filters (sidebar or top bar):**
- Blood Type (multi-select checkboxes for all 8)
- Urgency Level (Critical / Urgent / Normal)
- Division (dropdown)
- District (dropdown, dependent on division)
- Status (Open / Fulfilled / All)
- Sort by: Newest | Most Urgent | Nearest (if location available)

**Request Card shows:**
- Urgency badge (color-coded)
- Blood type badge
- Patient name + units needed
- Hospital name + district
- Time since posted ("2 hours ago")
- Donor response count
- "View Details" button

**Pagination:** 12 cards per page with load-more button.

### 10.6 Request Detail (`/requests/[id]`)
**Public page (no login required to view).**

**Shows:**
- Full request info
- Map (Leaflet) centered on hospital location (if lat/lng available, otherwise show district label)
- Urgency indicator with pulsing animation for Critical
- "Respond as Donor" button (requires login + must be eligible)
- List of donors who have responded (name, blood type, status — anonymous if pending)
- Share buttons (copy link, share to WhatsApp)

**Donor Response Flow:**
1. Click "Respond as Donor"
2. Modal opens: confirm blood type, optional message, confirm availability
3. Submit → creates `donor_responses` row → sends notification to requester
4. Requester can mark response as "Completed" after actual donation

### 10.7 New Request Form (`/requests/new`)
**Requires authentication.**

Use `bloodRequestSchema` for validation. Multi-step form (3 steps):
- **Step 1:** Patient info (name, blood type, units, urgency, needed before date)
- **Step 2:** Location (hospital name, address, district, division)
- **Step 3:** Contact & description, review & submit

After submit: redirect to `/requests/[id]` with success toast.

### 10.8 Donor Directory (`/donors`)
**Filterable list of available, eligible donors.**

**Filters:**
- Blood Type
- Division
- District
- Department
- Batch/Year
- Availability (available only toggle)

**Toggle between List View and Map View:**
- **List View:** DonorCard with avatar, name, blood type badge, department, batch, district, total donations, availability status. "Contact" button (shows phone if logged in, blurred if not).
- **Map View:** React-Leaflet map with clustered markers. Each marker popup shows donor name, blood type, district. Click → opens donor profile.

**Privacy rule:** Contact number only visible to logged-in users.

### 10.9 Donor Profile (`/donors/[id]`)
- Avatar, name, blood type, department, batch, district
- Total donations count, member since date
- Donation history timeline (public: hospital name + date, no patient data)
- "Request This Donor" button → prefills `/requests/new` with their blood type

### 10.10 My History (`/history`)
- **Tab 1: My Donations** — Table: Date | Hospital | Blood Type | Units | Request | Certificate Download
- **Tab 2: My Requests** — Table: Date | Blood Type | Units | Hospital | Status | Responses Count
- **Tab 3: My Responses** — Table: Date | Request | My Status | Action (mark as completed)

### 10.11 Notifications (`/notifications`)
- List of all notifications, newest first
- Unread have highlighted background
- Mark all as read button
- Click notification → navigate to `link` field
- Real-time updates using Supabase Realtime subscription

### 10.12 Inventory (`/inventory`) — Hospital/Blood Bank Only
- 8 blood type cards in a 4×2 grid
- Each card: blood type, current units, threshold, +/- buttons to adjust
- Cards glow red when below threshold
- History log of adjustments
- "Export Report" button (CSV download)

### 10.13 Admin Panel (`/admin`) — Admin Role Only
- **Users Tab:** Table of all users, search by name/email, role filter. Actions: change role, verify account, deactivate.
- **Requests Tab:** All requests with ability to force-close or flag.
- **Verification Queue:** Pending hospital/blood bank accounts with approve/reject buttons.
- **Analytics:** Charts (use recharts) — Donations per month bar chart, Blood type demand pie chart, Division-wise donor count map.

---

## 11. Key Hooks

### `src/hooks/useUser.ts`
```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@supabase/supabase-js'

export function useUser() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  return { user, loading }
}
```

### `src/hooks/useNotifications.ts`
```typescript
'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types'

export function useNotifications(userId: string | undefined) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Initial fetch
    supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
      .then(({ data }) => setNotifications(data ?? []))

    // Real-time subscription
    const channel = supabase.channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}`
      }, (payload) => {
        setNotifications(prev => [payload.new as Notification, ...prev])
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId])

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', userId!).eq('is_read', false)
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  return { notifications, unreadCount, markAllRead }
}
```

---

## 12. Leaflet Map Component

**Important:** Leaflet does not support SSR. Always use dynamic import with `ssr: false`.

### `src/components/donors/DonorMap.tsx`
```typescript
'use client'
import dynamic from 'next/dynamic'

const MapComponent = dynamic(() => import('./MapInner'), { ssr: false, loading: () => <div className="h-96 bg-muted animate-pulse rounded-xl" /> })

export default function DonorMap({ donors }: { donors: Profile[] }) {
  return <MapComponent donors={donors} />
}
```

### `src/components/donors/MapInner.tsx`
```typescript
'use client'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { Profile } from '@/types'

// Fix default marker icons in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

// Copy leaflet marker files to /public/leaflet/ during setup

const bloodIcon = L.divIcon({
  html: `<div style="background:#C41E3A;width:32px;height:32px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3)"></div>`,
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  className: ''
})

export default function MapInner({ donors }: { donors: Profile[] }) {
  const validDonors = donors.filter(d => d.latitude && d.longitude)
  const center: [number, number] = validDonors.length > 0
    ? [validDonors[0].latitude!, validDonors[0].longitude!]
    : [23.8103, 90.4125] // Dhaka default

  return (
    <MapContainer center={center} zoom={10} className="h-96 w-full rounded-xl z-0">
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {validDonors.map(donor => (
        <Marker key={donor.id} position={[donor.latitude!, donor.longitude!]} icon={bloodIcon}>
          <Popup>
            <div className="text-sm">
              <p className="font-semibold">{donor.full_name}</p>
              <p className="text-blood font-bold">{donor.blood_type}</p>
              <p className="text-muted-foreground">{donor.department}</p>
              <p className="text-muted-foreground">{donor.present_district}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
```

**Add to `next.config.js`:**
```javascript
const nextConfig = {
  images: { remotePatterns: [{ protocol: 'https', hostname: '*.supabase.co' }] }
}
module.exports = nextConfig
```

Copy Leaflet marker files to `/public/leaflet/`:
```bash
cp node_modules/leaflet/dist/images/* public/leaflet/
```

---

## 13. API Routes

### `src/app/api/donors/nearby/route.ts`
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

  const { data, error } = await query.order('total_donations', { ascending: false }).limit(50)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ donors: data })
}
```

### `src/app/api/notifications/send/route.ts`
```typescript
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const { user_ids, title, message, type, link } = await req.json()
  const supabase = createClient()

  const notifications = user_ids.map((id: string) => ({ user_id: id, title, message, type, link }))
  const { error } = await supabase.from('notifications').insert(notifications)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
```

---

## 14. Shared Components Specification

### `BloodTypeBadge.tsx`
```typescript
import { BLOOD_TYPE_COLORS } from '@/lib/constants'
import { cn } from '@/lib/utils'

export function BloodTypeBadge({ type, size = 'md' }: { type: string; size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'text-xs px-1.5 py-0.5', md: 'text-sm px-2 py-1', lg: 'text-base px-3 py-1.5 font-bold' }
  return (
    <span className={cn('inline-flex items-center rounded-full border font-semibold', BLOOD_TYPE_COLORS[type], sizes[size])}>
      {type}
    </span>
  )
}
```

### `UrgencyBadge.tsx`
```typescript
import { URGENCY_CONFIG } from '@/lib/constants'

export function UrgencyBadge({ urgency }: { urgency: 'critical' | 'urgent' | 'normal' }) {
  const config = URGENCY_CONFIG[urgency]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${config.color}`}>
      {config.icon} {config.label}
    </span>
  )
}
```

### `EligibilityBanner.tsx`
```typescript
import { differenceInDays, addDays, format } from 'date-fns'
import { DONATION_COOLDOWN_DAYS } from '@/lib/constants'

export function EligibilityBanner({ profile }: { profile: Profile }) {
  if (profile.is_eligible) {
    return (
      <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-xl">
        <div className="w-3 h-3 bg-green-500 rounded-full pulse-ring" />
        <div>
          <p className="font-semibold text-green-800">You are eligible to donate</p>
          <p className="text-sm text-green-600">Toggle your availability below to receive emergency alerts.</p>
        </div>
      </div>
    )
  }

  const nextEligibleDate = addDays(new Date(profile.last_donation_date!), DONATION_COOLDOWN_DAYS)
  const daysLeft = differenceInDays(nextEligibleDate, new Date())

  return (
    <div className="flex items-center gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div className="text-2xl">⏳</div>
      <div>
        <p className="font-semibold text-amber-800">Donation cooldown: {daysLeft} days remaining</p>
        <p className="text-sm text-amber-600">You can donate again on {format(nextEligibleDate, 'dd MMM yyyy')}.</p>
      </div>
    </div>
  )
}
```

---

## 15. Vercel Deployment

### 15.1 Steps
1. Push code to GitHub (the agent connects to your repo)
2. Go to https://vercel.com → Import Project → Select your GitHub repo
3. Framework: Next.js (auto-detected)
4. Add all environment variables from `.env.local` in Vercel dashboard under Settings → Environment Variables
5. Add `NEXT_PUBLIC_APP_URL` = your Vercel production URL
6. Deploy

### 15.2 Add Vercel URL to Supabase
In Supabase Dashboard → Authentication → URL Configuration:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: add `https://your-app.vercel.app/auth/callback`

### 15.3 `vercel.json` (optional, for custom config)
```json
{
  "framework": "nextjs",
  "buildCommand": "pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install"
}
```

---

## 16. Security Checklist

- [ ] All Supabase tables have RLS enabled (done in schema above)
- [ ] Service role key is NEVER exposed to the client (only in API routes)
- [ ] Contact numbers only shown to authenticated users
- [ ] Admin routes check `role === 'admin'` server-side (not just client-side)
- [ ] File uploads validate type (image/jpeg, image/png only) and size (max 2MB)
- [ ] All forms validated with Zod on both client and server
- [ ] `.env.local` is in `.gitignore`
- [ ] Passwords handled entirely by Supabase Auth (never stored manually)

---

## 17. Cron Job (Restore Donor Eligibility)

Use Supabase's pg_cron extension to run the eligibility restore function daily:

```sql
-- Enable pg_cron (run in Supabase SQL Editor)
SELECT cron.schedule(
  'restore-donor-eligibility',
  '0 0 * * *',  -- runs daily at midnight
  $$SELECT restore_donor_eligibility()$$
);
```

Enable pg_cron in Supabase Dashboard → Database → Extensions → search "pg_cron" → Enable.

---

## 18. Development Workflow

```bash
# Start development server
pnpm dev

# Type check
pnpm tsc --noEmit

# Lint
pnpm lint

# Build for production
pnpm build

# Generate Supabase types (after schema changes)
pnpm dlx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/types/database.ts
```

---

## 19. Final Implementation Order for Agent

Follow this exact order:

1. **Project init** → install deps → setup shadcn → create `.env.local`
2. **Supabase schema** → run all SQL → verify tables in dashboard
3. **Types & constants** → `src/types/index.ts`, `src/lib/constants.ts`, `src/lib/validations.ts`
4. **Supabase clients** → `client.ts`, `server.ts`, `middleware.ts`, `auth/callback/route.ts`
5. **Global styles** → `globals.css`, `tailwind.config.ts`
6. **Shared components** → BloodTypeBadge, UrgencyBadge, LoadingSpinner, EmptyState
7. **Layout components** → Navbar, Sidebar, MobileNav, Footer
8. **Auth pages** → `/login`, `/register`
9. **Profile complete page** → `/profile/complete` (most critical flow)
10. **Dashboard** → role-aware dashboard page
11. **Blood requests** → list, detail, new request form
12. **Donor directory** → list view + map view
13. **History page** → donations, requests, responses tabs
14. **Notifications** → page + real-time hook + bell component
15. **Inventory page** → hospital/blood bank only
16. **Admin panel** → admin only
17. **Landing page** → public marketing page
18. **API routes** → nearby donors, send notifications
19. **Leaflet setup** → copy marker files, dynamic import
20. **Deploy to Vercel** → add env vars → connect Supabase redirect URLs

---

## 20. Do Not Do (Common Mistakes to Avoid)

- ❌ Do NOT use `pages/` router — use App Router only
- ❌ Do NOT import Leaflet at top level — always `dynamic(() => import(...), { ssr: false })`
- ❌ Do NOT use `localStorage` for auth state — Supabase SSR handles cookies
- ❌ Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` in client components
- ❌ Do NOT skip the profile complete middleware check — it breaks the onboarding flow
- ❌ Do NOT use `getServerSideProps` or `getStaticProps` — use server components and `async` page functions
- ❌ Do NOT use `useRouter().push()` for post-auth redirects — use `redirect()` from `next/navigation` in server components
- ❌ Do NOT store passwords — Supabase Auth handles everything
- ❌ Do NOT use Arial or Inter fonts — project uses Sora + DM Sans
- ❌ Do NOT use percentage widths in tables — use fixed pixel/rem values
