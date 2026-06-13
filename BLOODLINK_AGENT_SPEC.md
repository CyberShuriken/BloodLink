# BloodLink — Complete Project Specification
## AI Build Guide for Full-Stack University Blood Donation Platform

> **READ THIS ENTIRE FILE BEFORE WRITING A SINGLE LINE OF CODE.**
> This is the single source of truth. Every decision, every file, every edge case is described here.
> When in doubt, re-read. Do not assume. Do not skip sections.

---

## 0. Project Overview

**BloodLink** is a full-stack web application that connects university students as blood donors with patients, hospitals, and blood banks — all within one coordinated network. The platform is university-specific: every donor is a verified student at a single institution.

### Core Goals
- Students register via **Google OAuth only** (university Gmail).
- After registration, students fill a **mandatory onboarding form** before accessing the dashboard.
- Two distinct portals: **User Portal** and **Admin Portal**.
- Real-time emergency alerts, donor matching, blood request management.
- Deployed on **Vercel** (frontend/API) backed by **Supabase** (PostgreSQL, Auth, Storage, Realtime).

### Current Project State
The project already has a significant codebase at the root. Key completed files include:
- `src/types/index.ts` — all TypeScript types ✅
- `src/lib/constants.ts` — blood types, urgency config, etc. ✅
- `src/lib/validations.ts` — Zod schemas ✅
- `src/lib/supabase/client.ts` & `server.ts` ✅
- `src/lib/utils.ts` — `cn()` and `haversineKm()` ✅
- `src/app/globals.css` — BloodLink theme ✅
- `tailwind.config.ts` — blood colors, animations ✅
- `middleware.ts` — route protection ✅
- `src/app/layout.tsx` — root layout ✅
- Auth pages (`/login`, `/register`) ✅
- Dashboard layout & pages ✅
- All shared components (BloodTypeBadge, UrgencyBadge, etc.) ✅
- `src/components/donors/DonorMap.tsx` + `DonorMapInner.tsx` ✅
- Request CRUD pages ✅

**What still needs to be built or fixed is described in Section 12 (Remaining Work).**

---

## 1. Tech Stack (Non-Negotiable)

| Layer | Technology |
|---|---|
| Framework | **Next.js 14** (App Router, TypeScript strict) |
| Styling | **Tailwind CSS** + **shadcn/ui** (slate base, CSS variables) |
| Backend / DB | **Supabase** (PostgreSQL, Auth, Storage, Realtime) |
| Authentication | **Supabase Auth — Google OAuth only** |
| Maps | **Leaflet.js** + **React-Leaflet** (`ssr: false`) |
| Email | **Resend** via Supabase Edge Functions |
| Deployment | **Vercel** |
| Package Manager | **pnpm** |
| Validation | **Zod** + **React Hook Form** |
| Icons | **Lucide React** |
| Charts | **Recharts** |
| Notifications | **Sonner** |

---

## 2. Authentication — Google OAuth Only

### 2.1 Rules
- **Only Google sign-in is supported.** No email/password auth for the user-facing portal.
- Students sign in with their **university Gmail** (`@youruni.edu.bd` — configurable).
- Admin accounts are created manually in the Supabase dashboard and have `role = 'admin'` in `profiles`.
- After first Google sign-in, user is redirected to `/profile/complete` if `is_profile_complete = false`.
- The dashboard layout **blocks access and redirects** to `/profile/complete` until the profile is complete.

### 2.2 OAuth Flow
```
User clicks "Sign in with Google"
  → Supabase OAuth redirect
  → Google consent screen
  → Callback: /auth/callback?code=...
  → supabase.auth.exchangeCodeForSession(code)
  → Check profiles.is_profile_complete
    → false → redirect to /profile/complete
    → true  → redirect to /dashboard
```

### 2.3 Remove Email/Password
The existing `LoginForm.tsx` and `RegisterForm.tsx` contain email/password fields. **Replace them** with Google-only buttons. See Section 12.4 for exact implementation.

### 2.4 Environment Variables
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
RESEND_API_KEY=your-resend-api-key
NEXT_PUBLIC_UNIVERSITY_NAME="Your University Name"
NEXT_PUBLIC_UNIVERSITY_EMAIL_DOMAIN=youruni.edu.bd
```

---

## 3. Database Schema

Run **all** of this SQL in Supabase SQL Editor in order. Do not skip any block.

### 3.1 Enums
```sql
CREATE TYPE blood_type AS ENUM ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-');
CREATE TYPE user_role AS ENUM ('donor', 'patient', 'hospital_staff', 'blood_bank_admin', 'admin');
CREATE TYPE request_status AS ENUM ('open', 'partially_fulfilled', 'fulfilled', 'cancelled', 'expired');
CREATE TYPE response_status AS ENUM ('pending', 'accepted', 'rejected', 'completed', 'no_show');
CREATE TYPE urgency_level AS ENUM ('critical', 'urgent', 'normal');
```

### 3.2 Profiles Table
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
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
```

### 3.3 Blood Requests Table
```sql
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
```

### 3.4 Donor Responses Table
```sql
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
```

### 3.5 Donations Table
```sql
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
```

### 3.6 Notifications Table
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('emergency', 'response', 'system', 'reminder')),
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.7 Blood Inventory Table
```sql
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
```

### 3.8 Indexes
```sql
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
```

### 3.9 Functions and Triggers
```sql
-- updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER update_blood_requests_updated_at
  BEFORE UPDATE ON blood_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'donor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Mark donor ineligible after confirmed donation
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

-- Restore eligibility after 90 days (run via pg_cron daily)
CREATE OR REPLACE FUNCTION restore_donor_eligibility()
RETURNS void AS $$
BEGIN
  UPDATE profiles SET is_eligible = TRUE
  WHERE is_eligible = FALSE
    AND last_donation_date IS NOT NULL
    AND last_donation_date <= CURRENT_DATE - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;
```

### 3.10 Row Level Security (RLS)
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE donor_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_inventory ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles are publicly readable" ON profiles FOR SELECT USING (TRUE);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Blood requests
CREATE POLICY "Blood requests are public" ON blood_requests FOR SELECT USING (TRUE);
CREATE POLICY "Authenticated users can create requests" ON blood_requests
  FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Owners can update own requests" ON blood_requests
  FOR UPDATE USING (auth.uid() = requester_id);

-- Donor responses
CREATE POLICY "Donors can see their responses" ON donor_responses
  FOR SELECT USING (
    auth.uid() = donor_id OR
    auth.uid() = (SELECT requester_id FROM blood_requests WHERE id = request_id)
  );
CREATE POLICY "Donors can create responses" ON donor_responses
  FOR INSERT WITH CHECK (auth.uid() = donor_id);
CREATE POLICY "Donors can update own responses" ON donor_responses
  FOR UPDATE USING (auth.uid() = donor_id);

-- Donations
CREATE POLICY "Donors can see own donations" ON donations
  FOR SELECT USING (auth.uid() = donor_id);

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- Inventory
CREATE POLICY "Inventory is public" ON blood_inventory FOR SELECT USING (TRUE);
CREATE POLICY "Managers can manage inventory" ON blood_inventory
  FOR ALL USING (auth.uid() = managed_by);
```

### 3.11 Storage Buckets
```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('certificates', 'certificates', TRUE);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', TRUE);

CREATE POLICY "Anyone can view avatars"
  ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Auth users can upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "Anyone can view certificates"
  ON storage.objects FOR SELECT USING (bucket_id = 'certificates');
```

### 3.12 pg_cron for Eligibility Restore
```sql
-- Enable pg_cron in Supabase Dashboard → Database → Extensions → pg_cron
SELECT cron.schedule(
  'restore-donor-eligibility',
  '0 0 * * *',
  $$SELECT restore_donor_eligibility()$$
);
```

---

## 4. File & Folder Structure

```
bloodlink/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx           ← Google-only login
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx             ← Auth guard + profile guard
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx           ← Role-aware dashboard
│   │   │   │   └── AvailabilityToggle.tsx
│   │   │   ├── profile/
│   │   │   │   ├── page.tsx           ← View own profile
│   │   │   │   └── complete/
│   │   │   │       └── page.tsx       ← MANDATORY onboarding form
│   │   │   ├── donors/
│   │   │   │   ├── page.tsx           ← Donor directory
│   │   │   │   └── [id]/page.tsx      ← Donor profile view
│   │   │   ├── requests/
│   │   │   │   ├── page.tsx           ← All blood requests
│   │   │   │   ├── new/page.tsx       ← Create request
│   │   │   │   └── [id]/page.tsx      ← Request detail + respond
│   │   │   ├── history/page.tsx       ← My donations/requests/responses
│   │   │   ├── notifications/page.tsx
│   │   │   ├── inventory/page.tsx     ← Hospital/blood bank only
│   │   │   └── admin/                 ← ADMIN PORTAL
│   │   │       ├── page.tsx           ← Admin dashboard
│   │   │       ├── users/page.tsx     ← User management
│   │   │       ├── requests/page.tsx  ← All requests management
│   │   │       └── inventory/page.tsx ← Platform-wide inventory
│   │   ├── auth/
│   │   │   └── callback/route.ts      ← OAuth callback handler
│   │   ├── api/
│   │   │   ├── donors/nearby/route.ts
│   │   │   └── notifications/send/route.ts
│   │   ├── layout.tsx                 ← Root layout
│   │   ├── page.tsx                   ← Public landing page
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                        ← shadcn components (do not modify)
│   │   ├── layout/
│   │   │   ├── Navbar.tsx             ← Desktop nav (md+)
│   │   │   ├── MobileNav.tsx          ← Mobile nav + sheet drawer
│   │   │   └── UserProfileContext.tsx ← React context
│   │   ├── auth/
│   │   │   ├── GoogleSignInButton.tsx ← Replaces old LoginForm/RegisterForm
│   │   │   └── ProfileCompleteForm.tsx
│   │   ├── dashboard/
│   │   │   ├── StatsCard.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   ├── EmergencyAlert.tsx
│   │   │   └── AdminCharts.tsx
│   │   ├── donors/
│   │   │   ├── DonorMap.tsx           ← SSR-safe wrapper
│   │   │   ├── DonorMapInner.tsx      ← Actual Leaflet (client only)
│   │   │   ├── DonorFilters.tsx
│   │   │   └── DonorMapToggle.tsx
│   │   ├── requests/
│   │   │   ├── RequestCard.tsx
│   │   │   ├── RequestDetail.tsx
│   │   │   ├── RequestForm.tsx
│   │   │   └── RequestFilters.tsx
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx
│   │   │   └── NotificationsPanel.tsx
│   │   ├── inventory/
│   │   │   └── InventoryBoard.tsx
│   │   └── shared/
│   │       ├── BloodTypeBadge.tsx
│   │       ├── UrgencyBadge.tsx
│   │       ├── EligibilityBanner.tsx
│   │       ├── SkeletonLoader.tsx
│   │       ├── EmptyState.tsx
│   │       ├── LoadingSpinner.tsx
│   │       └── MapErrorBoundary.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   └── server.ts
│   │   ├── utils.ts                   ← cn(), haversineKm()
│   │   ├── constants.ts
│   │   └── validations.ts
│   ├── hooks/
│   │   ├── useUserProfile.ts
│   │   └── useNotifications.ts
│   └── types/
│       └── index.ts
├── middleware.ts
├── tailwind.config.ts
├── next.config.mjs
├── vercel.json
└── .env.local                         ← Never commit
```

---

## 5. Route Map

### 5.1 Public Routes (No Auth Required)
| Route | Description |
|---|---|
| `/` | Marketing landing page |
| `/login` | Google sign-in page |

### 5.2 Protected Routes (Auth + Profile Complete Required)
| Route | Roles | Description |
|---|---|---|
| `/dashboard` | all | Role-aware dashboard |
| `/profile` | all | View own profile |
| `/profile/complete` | all | Onboarding form (blocked if already complete) |
| `/donors` | all | Donor directory with map toggle |
| `/donors/[id]` | all | Individual donor profile |
| `/requests` | all | Blood request listing with filters |
| `/requests/new` | all | Create a blood request |
| `/requests/[id]` | all | Request detail + donor response |
| `/history` | all | My donations, requests, responses |
| `/notifications` | all | Notification center |

### 5.3 Role-Gated Protected Routes
| Route | Roles Allowed | Description |
|---|---|---|
| `/inventory` | `hospital_staff`, `blood_bank_admin` | Blood inventory management |
| `/admin` | `admin` | Admin dashboard |
| `/admin/users` | `admin` | User management |
| `/admin/requests` | `admin` | All requests management |

### 5.4 API Routes
| Route | Method | Description |
|---|---|---|
| `/api/donors/nearby` | GET | Filter eligible donors by location/blood type |
| `/api/notifications/send` | POST | Send notifications (server-side) |
| `/auth/callback` | GET | Supabase OAuth callback |

---

## 6. User Portal — Detailed Page Specs

### 6.1 Landing Page (`/`)

**Sections (top to bottom):**

1. **Sticky Navbar**
   - Logo (blood-drop SVG + "BloodLink" in `text-blood font-bold`)
   - Right: "Sign In" link + "Register as Donor" button (both go to `/login`)

2. **Hero Section** (`blood-gradient` background)
   - Headline: "Every Drop Counts."
   - Subheadline: "Connect with nearby student donors in seconds during emergencies."
   - Two CTA buttons: "Find a Donor" → `/donors` | "Register as Donor" → `/login`
   - Animated blood-drop SVG with `pulse-ring` CSS animation
   - Live badge: "Live emergencies in your area"

3. **Stats Bar** (dark background)
   - Pull live counts from Supabase: Total Donors, Donations Completed, Districts Active, Lives Saved (est.)
   - Numbers animate with `animate-count-up`

4. **How It Works** (3 steps with icons)
   - Post Emergency Request → We Match Nearby Donors → Donor Responds & Saves a Life

5. **Blood Type Compatibility Chart**
   - Full ABO+Rh matrix table using `BLOOD_COMPATIBILITY` constant
   - `BloodTypeBadge` in headers and row labels

6. **Active Critical Requests** (conditionally rendered if any exist)
   - Pull 3 most recent `urgency = 'critical'` open requests
   - Show: hospital name, district, blood type, units needed
   - "Respond Now" CTA per card

7. **Testimonials** (static placeholder, 3 cards)

8. **CTA Section**: "Join 500+ Student Donors" + Register button

9. **Footer**: Logo, nav links, copyright

---

### 6.2 Login Page (`/login`)

**Layout:** Centered card on gradient background. No header nav.

**Content:**
```
BloodLink logo + tagline at top

Card:
  Title: "Welcome to BloodLink"
  Subtitle: "Sign in with your university Google account"

  [Continue with Google] button (full-width, Google colors)
    → triggers supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: `${origin}/auth/callback` } })

  Divider: "University students only"

  Footer note: "By signing in, you agree to donate responsibly."

  Link: "Learn more about BloodLink" → /
```

**IMPORTANT:** Remove all email/password fields. No fallback login method in the user portal.

---

### 6.3 Profile Complete Page (`/profile/complete`)

This page is **mandatory** and blocks all other dashboard access.

**Guard logic (in dashboard layout.tsx):**
```typescript
if (!profile.is_profile_complete && pathname !== '/profile/complete') {
  redirect('/profile/complete')
}
```

**Form — 3 Steps:**

**Step 1: Personal Details**
| Field | Type | Validation | Notes |
|---|---|---|---|
| Full Name | text input | min 2 chars | Pre-filled from Google |
| Student ID | text input | required | e.g. "2021-01-001" |
| Department | select | required | From `DEPARTMENTS` constant |
| Batch Year | select | 4-digit year | Last 8 years |
| Blood Type | button grid (8 options) | required | Visual blood type selector |
| Contact Number | text input | BD phone regex | `01XXXXXXXXX` |
| Profile Photo | file upload | JPEG/PNG, max 2MB | Uploads to Supabase `avatars` bucket |

**Step 2: Address**
| Field | Type | Validation |
|---|---|---|
| Present Address | textarea | min 10 chars |
| Present Division | select | 8 BD divisions |
| Present District | select | filtered by division |
| "Same as present" checkbox | checkbox | auto-fills permanent |
| Permanent Address | textarea | min 10 chars |
| Permanent Division | select | 8 BD divisions |
| Permanent District | select | filtered by division |

**Step 3: Bio + Review**
| Field | Type | Validation |
|---|---|---|
| Bio | textarea | max 300 chars, optional |
| Review summary | display only | shows all filled values |

**On Submit:**
1. Upload avatar if provided → get public URL
2. `supabase.from('profiles').update({ ...values, is_profile_complete: true })`
3. Toast: "Profile complete! Welcome to BloodLink 🎉"
4. Redirect to `/dashboard`

---

### 6.4 Donor Dashboard (`/dashboard`) — Role: `donor`

**Mobile Layout (< lg):** Single column, top-to-bottom:
1. `AvailabilityToggle` — "GO AVAILABLE" (crimson) / "OFF DUTY" (slate)
2. `EligibilityBanner` — green if eligible, yellow with next-date if not
3. "Nearby Emergency Alerts" heading
4. `RequestCard` list (sorted: critical → urgent → normal)
5. `EmptyState` if no requests

**Desktop Layout (>= lg):** 3-column grid:

| Left Column | Center Column | Right Column |
|---|---|---|
| Avatar + name + BloodTypeBadge | DonorMap (Leaflet) | ActivityFeed |
| StatsCard: Total Donations | min-height: 400px | scrollable donation list |
| StatsCard: Requests Nearby | Error boundary fallback | EmptyState if none |
| StatsCard: Donor Rank | SkeletonLoader while loading | SkeletonLoader while loading |
| AvailabilityToggle | | |

**EmergencyAlert** component mounts at the top (renders nothing visually, just a side-effect for Realtime subscription).

**Donor Rank logic:**
```
>= 20 donations → "Gold"
>= 10 donations → "Silver"
>= 5 donations  → "Bronze"
< 5 donations   → "Newcomer"
```

---

### 6.5 Patient/General User Dashboard (`/dashboard`) — Role: `patient`

- "Need blood?" card with "Post a new request" and "Browse active requests" CTAs
- Stats: Open requests nearby, urgent requests, available donors in district
- "Live requests" section showing 4 most recent

---

### 6.6 Hospital Staff / Blood Bank Dashboard (`/dashboard`) — Role: `hospital_staff` or `blood_bank_admin`

- "Blood Inventory" summary grid (8 blood types, red if below threshold)
- Recent requests from their district
- Quick inventory update buttons

---

### 6.7 Blood Requests Page (`/requests`)

**Filters (sidebar):**
- Blood type: 8 button grid (toggle)
- Urgency: select (any / critical / urgent / normal)
- Status: select (open / fulfilled / all)
- Division: select
- District: select (filtered by division)
- "Clear all" link

**Results grid:** 12 cards per page, `RequestCard` component

**Pagination:** Previous / Next links using URL search params

**"Post Request" button** (top right) → `/requests/new`

---

### 6.8 Request Detail Page (`/requests/[id]`)

**Public page** — visible without login, but responding requires auth.

**Sections:**
1. Header card: urgency badge, hospital name, blood type badge, address, phone (blurred if not logged in), time posted, units fulfilled/needed, needed_before, description
2. "Respond as Donor" button (conditional logic — see below)
3. Donor responses list (anonymous if pending, shows blood type badge)

**Button logic:**
```
Not logged in       → "Sign in to Respond" → /login
Already responded   → Green "You have responded ✓" badge
Not eligible        → Disabled "Not eligible (cooldown)"
Not available       → Disabled "Set yourself available first"
Request closed      → Disabled "Request closed"
Can respond         → "🩸 Respond as Donor" → opens dialog
```

**Response dialog:**
- Shows donor's blood type and eligibility
- Optional message textarea (max 300 chars)
- "Confirm Response" → inserts into `donor_responses`

---

### 6.9 New Request Form (`/requests/new`)

**3-step form with progress bar:**

Step 1 — Patient Info:
- Patient Name (min 2)
- Blood Type (button grid)
- Units Needed (1–10)
- Urgency (select)
- Needed Before (datetime-local, optional)

Step 2 — Location:
- Hospital Name (min 2)
- Hospital Address (min 10)
- Division (select)
- District (select, filtered)

Step 3 — Contact & Submit:
- Contact Number (BD regex)
- Description (max 500, optional)
- Review summary
- "Post Request 🩸" button

**On Submit:**
- `supabase.from('blood_requests').insert({ ...values, requester_id: user.id })`
- Redirect to `/requests/[id]`

---

### 6.10 Donor Directory (`/donors`)

**Toggle:** List View ↔ Map View

**List View:** Grid of donor cards showing name, blood type, department, district, availability, total donations → "View profile" link

**Map View:** Leaflet map with donor markers (crimson divIcons) and request markers (urgency-colored). Full-screen on mobile.

**Filters:** Blood type, division, district, availability toggle

---

### 6.11 History Page (`/history`)

**3 tabs:**
1. My Donations — table: date, hospital, blood type, units
2. My Requests — table: date, hospital, status, responses count
3. My Responses — table: date, request, status, action (mark as completed)

---

### 6.12 Notifications Page (`/notifications`)

- List of all notifications, newest first
- Unread: highlighted `bg-blood-muted` background
- "Mark all as read" button
- Real-time updates via Supabase Realtime subscription
- Click navigates to `notification.link`

---

### 6.13 My Profile Page (`/profile`)

Shows user's own profile card:
- Avatar, name, blood type badge, department, batch, district
- Eligibility banner
- Contact info
- Edit button → opens inline edit or navigates to `/profile/edit`
- Total donations, member since date

---

## 7. Admin Portal — Detailed Specs

**Access:** Only users with `role = 'admin'` in `profiles`. All admin routes redirect non-admins to `/dashboard`.

**Admin check in layout:**
```typescript
if (profile.role !== 'admin') redirect('/dashboard')
```

### 7.1 Admin Dashboard (`/admin`)

**Sections:**

1. **Platform Stats Row** (4 cards):
   - Total registered users
   - Active blood requests
   - Donations this month
   - Pending verifications

2. **Analytics Charts** (via Recharts):
   - Bar chart: Blood requests by type
   - Pie chart: Requests by urgency
   - Pie chart: User roles breakdown

3. **Verification Queue**:
   - List of unverified hospital/blood bank accounts
   - Each card: name, email, role, created date
   - Actions: "Verify" (sets `is_verified = true`) | "Reject" (sets `role = 'donor'`)

4. **Recent Activity Feed** (last 10 events across all tables)

---

### 7.2 User Management (`/admin/users`)

**Table columns:** Name, Email, Role, Blood Type, District, Verified, Joined, Actions

**Actions per row:**
- Change role (dropdown: donor / patient / hospital_staff / blood_bank_admin / admin)
- Verify/Unverify toggle
- Deactivate (sets `is_available = false` and `is_eligible = false`)

**Filters:** Role, Blood Type, Division, Verified status

**Search:** Full-text search on name/email (client-side filter)

**Pagination:** 20 users per page

---

### 7.3 Requests Management (`/admin/requests`)

**Table columns:** ID (truncated), Hospital, Blood Type, Urgency, Status, District, Created, Requester, Actions

**Actions:**
- View detail → `/requests/[id]`
- Force close (sets `status = 'cancelled'`)
- Flag (adds a flag note)

**Filters:** Status, Urgency, Blood Type, Division

---

### 7.4 Admin-specific Supabase Queries

Admin uses the **service role client** for unrestricted access:
```typescript
// src/lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)
```

**NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` in client components. Admin queries happen only in Server Components or API Route Handlers.

---

## 8. Navigation Components

### 8.1 Desktop Navbar (`Navbar.tsx`) — hidden on mobile

```
[Blood drop SVG] BloodLink  |  Dashboard  Find Donors  Requests  History  Notifications  |  [Bell icon + badge]  [Avatar dropdown]
```

- Sticky (`sticky top-0 z-50`)
- Active link: `font-semibold text-blood border-b-2 border-blood`
- Bell badge: unread count, capped at 99+
- Avatar dropdown: My Profile | Settings | Sign Out
- Sign Out: `supabase.auth.signOut()` → `router.push('/login')`
- Admin link shown if `profile.role === 'admin'`
- Inventory link shown if `role === 'hospital_staff' || 'blood_bank_admin'`

### 8.2 Mobile Top Header (inside `MobileNav.tsx`) — visible only on mobile

```
[☰ Menu icon]    BloodLink    [🔔 Bell icon]
```

- Hamburger opens Sheet drawer (left side) with full nav list
- Bell shows unread badge

### 8.3 Mobile Bottom Tab Bar (inside `MobileNav.tsx`)

5-slot grid:
```
[Home]  [Requests]  [+ FAB]  [Donors]  [Profile]
```

- FAB (`+` button) navigates to `/requests/new`, raised style, `bg-blood rounded-full`
- Active tab: `text-blood` + small crimson dot above icon
- Profile tab shows unread badge capped at 99
- Hidden on `md:` and above

### 8.4 Sheet Drawer Contents (inside `MobileNav.tsx`)

Full link list including:
- Dashboard, Find Donors, Requests, History, Notifications
- Admin (if `role === 'admin'`)
- Inventory (if `role === 'hospital_staff'` or `'blood_bank_admin'`)
- Settings, Sign Out at bottom

---

## 9. Realtime Features

### 9.1 EmergencyAlert Component

File: `src/components/dashboard/EmergencyAlert.tsx`

```typescript
// Runs on mount, subscribes to new blood_requests
useEffect(() => {
  if (!profile.is_available) return  // don't alert off-duty donors

  const channel = supabase
    .channel('emergency-blood-requests')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'blood_requests' },
      (payload) => {
        const req = payload.new as BloodRequest
        if (req.urgency !== 'critical') return
        if (!req.latitude || !req.longitude) return
        const dist = haversineKm(profile.latitude, profile.longitude, req.latitude, req.longitude)
        if (dist > 10) return  // only within 10km

        toast.custom((t) => (
          <div className="bg-white border-l-4 border-blood animate-flash-red rounded-lg shadow-lg p-4">
            <p className="font-bold text-blood">🚨 Critical Blood Request</p>
            <p>{req.hospital_name} needs <strong>{req.blood_type}</strong></p>
            <Link href={`/requests/${req.id}`} onClick={() => toast.dismiss(t)}>
              Respond Now →
            </Link>
          </div>
        ), { duration: 15000 })
      })
    .subscribe()

  return () => supabase.removeChannel(channel)
}, [profile.is_available, profile.latitude, profile.longitude])
```

### 9.2 Notifications Realtime

File: `src/components/notifications/NotificationsPanel.tsx`

Subscribes to `INSERT` and `UPDATE` events on `notifications` table filtered by `user_id`.

---

## 10. Maps (Leaflet)

### 10.1 Critical Rules
- **NEVER** import Leaflet at top level. Always use `next/dynamic` with `ssr: false`.
- Always apply the Leaflet icon fix (delete `_getIconUrl`, set CDN URLs).
- Map container needs `style={{ height: '400px', width: '100%' }}` — Tailwind height classes don't work reliably with Leaflet.

### 10.2 Icon Colors
| Context | Color | Hex |
|---|---|---|
| Donor's own location | Blue | `#1D4ED8` |
| Critical request | Red | `#DC2626` |
| Urgent request | Orange | `#EA580C` |
| Normal request | Blue | `#2563EB` |
| Other donors | Crimson | `#C41E3A` |

### 10.3 Default Center
If `profile.latitude` or `profile.longitude` is null, center on **Dhaka, Bangladesh**: `[23.8103, 90.4125]`, zoom 12.

---

## 11. Design System

### 11.1 Color Palette

| Token | Value | Usage |
|---|---|---|
| `blood.DEFAULT` | `#C41E3A` | Primary crimson |
| `blood.dark` | `#8B0000` | Dark red hover states |
| `blood.light` | `#F5C6CE` | Light pink backgrounds |
| `blood.muted` | `#FDF0F2` | Very light pink backgrounds |
| `crimson` | `#C41E3A` | Tailwind alias |

### 11.2 Typography
- **Display (headings):** Sora — used via `font-family: 'Sora', sans-serif` and class `font-display`
- **Body:** DM Sans — default body font
- Both loaded via Google Fonts `@import` in `globals.css`

### 11.3 Custom CSS Utilities (in `globals.css`)
```css
.blood-gradient        /* linear-gradient: #C41E3A → #8B0000 */
.blood-gradient-soft   /* light pink gradient for backgrounds */
.glass                 /* backdrop-blur glass effect */
.card-hover            /* hover:shadow-lg hover:-translate-y-0.5 */
.text-blood            /* color: #C41E3A */
.bg-blood              /* background-color: #C41E3A */
.border-blood          /* border-color: #C41E3A */
.pulse-ring            /* pulsing circle animation */
.animate-count-up      /* fadeIn on mount */
```

### 11.4 Custom Animations (in `tailwind.config.ts`)
- `animate-pulse-crimson` — scale 1→1.05→1 with opacity, 1.5s loop
- `animate-flash-red` — opacity 1→0.6→1, 1s loop (used on emergency toast)

### 11.5 Shadcn UI Components Used
button, card, input, label, select, textarea, badge, avatar, dialog, sheet, dropdown-menu, toast, separator, skeleton, form, table, tabs, alert

All shadcn components inherit BloodLink theme via `--primary: 0 75% 42%` and `--ring: 0 75% 42%` CSS variables.

---

## 12. Remaining Work & Fixes

This section describes what still needs to be built or corrected.

### 12.1 Remove Email/Password Auth

**Files to modify:**
- `src/app/(auth)/login/page.tsx` — replace with Google-only
- `src/components/auth/LoginForm.tsx` — DELETE this file
- `src/components/auth/RegisterForm.tsx` — DELETE this file

**New file:** `src/components/auth/GoogleSignInButton.tsx`
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'

export function GoogleSignInButton() {
  const handleSignIn = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })
  }
  return (
    <Button onClick={handleSignIn} className="w-full gap-3 h-12 text-base" variant="outline">
      {/* Google SVG icon */}
      <svg viewBox="0 0 24 24" className="h-5 w-5">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continue with Google
    </Button>
  )
}
```

**New login page** (`src/app/(auth)/login/page.tsx`):
```typescript
import Link from 'next/link'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center gap-6">
      {/* BloodLink logo */}
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold">Welcome to BloodLink</h1>
        <p className="text-muted-foreground text-sm mt-2">
          Sign in with your university Google account
        </p>
      </div>
      <div className="w-full max-w-sm space-y-4 bg-white rounded-2xl border shadow-sm p-6">
        <GoogleSignInButton />
        <p className="text-center text-xs text-muted-foreground">
          University students only · <Link href="/" className="text-blood hover:underline">Learn more</Link>
        </p>
      </div>
    </div>
  )
}
```

---

### 12.2 Admin Portal Pages (Build from Scratch)

**`src/app/(dashboard)/admin/users/page.tsx`**

```typescript
// Server Component
// 1. Verify profile.role === 'admin', else redirect('/dashboard')
// 2. Fetch all profiles with pagination (20 per page)
// 3. Render AdminUsersTable client component
```

**`src/components/admin/AdminUsersTable.tsx`** (Client Component)
- Full user table with sortable columns
- Role change dropdown per row (calls server action or API route)
- Verify/Deactivate toggle buttons
- Search bar (client-side filter on name/email)

**`src/app/(dashboard)/admin/requests/page.tsx`**

```typescript
// Server Component
// 1. Verify admin role
// 2. Fetch all blood_requests with pagination
// 3. Render AdminRequestsTable
```

---

### 12.3 Profile View Page (`/profile`)

**`src/app/(dashboard)/profile/page.tsx`** — Server Component

Fetches the current user's profile and renders:
- Large avatar with upload button
- All profile fields in a readable card layout
- Eligibility banner
- "Edit Profile" button (opens edit form or navigates to `/profile/edit`)
- Donation history summary

---

### 12.4 Auth Callback — Handle Missing Profile

Update `src/app/auth/callback/route.ts` to handle the case where the `handle_new_user()` trigger may have failed:

```typescript
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (error) return NextResponse.redirect(`${origin}/login?error=auth`)

    // Ensure profile exists (trigger may have failed)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .single()

      if (!profile) {
        // Create profile manually if trigger failed
        await supabase.from('profiles').insert({
          id: user.id,
          email: user.email!,
          full_name: user.user_metadata?.full_name ?? '',
          role: 'donor',
        })
      }
    }
  }
  return NextResponse.redirect(`${origin}/dashboard`)
}
```

---

### 12.5 Middleware Fix

Update `middleware.ts` to also protect `/profile/complete` from already-complete users:

The middleware does NOT need to check `is_profile_complete` — that check lives in the dashboard layout server component. Middleware only checks authentication.

---

### 12.6 `next.config.mjs` Update

Update to allow Supabase image URLs:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com', // Google profile photos
      },
    ],
  },
}
export default nextConfig
```

---

### 12.7 Missing `src/app/(dashboard)/profile/complete/page.tsx` Guard Fix

The current version of this page does NOT have the dashboard layout's profile-complete redirect guard because it IS the profile complete page. But the layout must skip the redirect for this specific path:

```typescript
// In src/app/(dashboard)/layout.tsx
const pathname = // get via headers().get('x-pathname') or use a different approach

// The profile/complete page is inside (dashboard) but must be accessible
// without is_profile_complete = true. Solution: check pathname
import { headers } from 'next/headers'

// In the layout server component:
const headersList = headers()
const xPathname = headersList.get('x-invoke-path') ?? ''

if (!profile.is_profile_complete && !xPathname.includes('/profile/complete')) {
  redirect('/profile/complete')
}
```

**Better approach** — move `/profile/complete` outside the dashboard route group:

Option A: Place `profile/complete/page.tsx` at `src/app/(auth)/profile/complete/page.tsx` (inside the auth layout).
Option B: Keep it inside dashboard but detect pathname via middleware.

**Recommended: Option A** — move it to auth group so it uses the auth layout (no navbar), which makes more sense UX-wise.

---

### 12.8 Supabase Realtime — Enable on Tables

In Supabase Dashboard → Database → Replication, enable Realtime for:
- `blood_requests` (for emergency alerts)
- `notifications` (for real-time notification bell)
- `donor_responses` (for request detail updates)

---

### 12.9 Vercel Configuration

**Supabase Redirect URLs to add in Supabase Dashboard → Auth → URL Configuration:**
```
https://your-app.vercel.app/auth/callback
https://your-custom-domain.com/auth/callback
http://localhost:3000/auth/callback
```

**Vercel Environment Variables (add all from `.env.local`):**
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_APP_URL`
- `RESEND_API_KEY`
- `NEXT_PUBLIC_UNIVERSITY_NAME`
- `NEXT_PUBLIC_UNIVERSITY_EMAIL_DOMAIN`

---

## 13. Constants & Data

### 13.1 Blood Types
```typescript
export const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const
```

### 13.2 Blood Compatibility Matrix
```typescript
// Donor → [Recipients who can receive from this donor]
export const BLOOD_COMPATIBILITY = {
  'O-':  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // universal donor
  'O+':  ['A+', 'B+', 'AB+', 'O+'],
  'A-':  ['A+', 'A-', 'AB+', 'AB-'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B+', 'B-', 'AB+', 'AB-'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB+', 'AB-'],
  'AB+': ['AB+'],  // universal recipient (donates only to AB+)
}
```

### 13.3 Bangladesh Divisions & Districts
All 8 divisions: Dhaka, Chittagong, Rajshahi, Khulna, Barisal, Sylhet, Rangpur, Mymensingh.
Full district list per division — see `src/lib/constants.ts`.

### 13.4 Urgency Config
```typescript
export const URGENCY_CONFIG = {
  critical: { label: 'Critical', color: 'bg-red-600 text-white',    icon: '🚨' },
  urgent:   { label: 'Urgent',   color: 'bg-orange-500 text-white', icon: '⚠️' },
  normal:   { label: 'Normal',   color: 'bg-blue-500 text-white',   icon: 'ℹ️' },
}
```

### 13.5 Blood Type Colors
```typescript
export const BLOOD_TYPE_COLORS: Record<BloodType, string> = {
  'A+':  'bg-red-100 text-red-800 border-red-300',
  'A-':  'bg-red-200 text-red-900 border-red-400',
  'B+':  'bg-blue-100 text-blue-800 border-blue-300',
  'B-':  'bg-blue-200 text-blue-900 border-blue-400',
  'AB+': 'bg-purple-100 text-purple-800 border-purple-300',
  'AB-': 'bg-purple-200 text-purple-900 border-purple-400',
  'O+':  'bg-green-100 text-green-800 border-green-300',
  'O-':  'bg-green-200 text-green-900 border-green-400',
}
```

### 13.6 Donation Cooldown
```typescript
export const DONATION_COOLDOWN_DAYS = 90
```

---

## 14. TypeScript Types Reference

All types live in `src/types/index.ts`. Summary:

```typescript
type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
type UserRole = 'donor' | 'patient' | 'hospital_staff' | 'blood_bank_admin' | 'admin'
type RequestStatus = 'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired'
type ResponseStatus = 'pending' | 'accepted' | 'rejected' | 'completed' | 'no_show'
type UrgencyLevel = 'critical' | 'urgent' | 'normal'

interface Profile { /* mirrors profiles table */ }
interface BloodRequest { /* mirrors blood_requests table */ }
interface DonorResponse { /* mirrors donor_responses table */ }
interface Donation { /* mirrors donations table */ }
interface Notification { /* mirrors notifications table */ }
interface BloodInventory { /* mirrors blood_inventory table */ }
interface NavItem { label, href, icon: LucideIcon, badge?: number }
interface DashboardStats { totalDonations, liveRequestsNearby, nextEligibleDate, donorRank }
```

---

## 15. Zod Validation Schemas Reference

All schemas in `src/lib/validations.ts`:

| Schema | Key Rules |
|---|---|
| `registerSchema` | email, password ≥8, full_name ≥2 |
| `profileCompleteSchema` | student_id, department, batch (4-digit), blood_type enum, BD phone regex, addresses ≥10, divisions enum, bio ≤300 optional |
| `bloodRequestSchema` | patient_name ≥2, blood_type enum, units_needed int 1–10, urgency enum, hospital fields, BD phone, description ≤500 optional, needed_before optional datetime |
| `donorResponseSchema` | message ≤300 optional |
| `loginSchema` | email, password min 1 |

---

## 16. Security Checklist

Before deployment, verify:

- [ ] All Supabase tables have RLS enabled
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is NEVER in client-side code
- [ ] Admin routes server-side check `profile.role === 'admin'`
- [ ] Contact numbers only visible to authenticated users (blur in public views)
- [ ] File uploads validate type (JPEG/PNG only) and size (max 2MB)
- [ ] All forms validated with Zod on both client and server
- [ ] `.env.local` is in `.gitignore`
- [ ] Passwords not stored anywhere (Google OAuth only)
- [ ] `is_profile_complete` check in dashboard layout prevents unauthorized dashboard access
- [ ] Leaflet never imported server-side (`ssr: false` on all map components)
- [ ] `NEXT_PUBLIC_*` vars contain NO secrets

---

## 17. Do Not Do — Common Mistakes

- ❌ Do NOT use `pages/` router — App Router only
- ❌ Do NOT import Leaflet at top level — always `dynamic(() => import(...), { ssr: false })`
- ❌ Do NOT use `localStorage` for auth — Supabase SSR handles cookies
- ❌ Do NOT expose `SUPABASE_SERVICE_ROLE_KEY` in client components
- ❌ Do NOT skip the `is_profile_complete` dashboard layout check
- ❌ Do NOT use `getServerSideProps` or `getStaticProps` — use server components
- ❌ Do NOT use `useRouter().push()` for post-auth redirects in server components — use `redirect()` from `next/navigation`
- ❌ Do NOT add email/password login — Google OAuth only
- ❌ Do NOT use Arial or Inter — fonts are Sora + DM Sans
- ❌ Do NOT hardcode hex colors in components — use Tailwind tokens (`text-blood`, `bg-blood`, etc.)
- ❌ Do NOT use `<form>` elements in React Client Components if using React 19+ patterns — use event handlers
- ❌ Do NOT stack multiple Realtime channel subscriptions without cleanup — always `removeChannel` in useEffect cleanup
- ❌ Do NOT render the map in a Server Component — use `DonorMap` wrapper which dynamic-imports `DonorMapInner`
- ❌ Do NOT forget to enable Realtime in Supabase Dashboard for tables that use it

---

## 18. Implementation Order for AI Agents

Follow this exact order. Each step depends on the previous.

### Wave 1 — Foundation (already done, verify)
1. Verify `src/types/index.ts` ✓
2. Verify `src/lib/constants.ts` ✓
3. Verify `src/lib/validations.ts` ✓
4. Verify `src/lib/supabase/client.ts` & `server.ts` ✓
5. Verify `src/lib/utils.ts` ✓
6. Verify `tailwind.config.ts` ✓
7. Verify `src/app/globals.css` ✓

### Wave 2 — Auth Refactor
8. Delete `LoginForm.tsx` and `RegisterForm.tsx`
9. Create `GoogleSignInButton.tsx`
10. Rewrite `src/app/(auth)/login/page.tsx` (Google-only)
11. Remove `/register` route entirely
12. Update `src/app/auth/callback/route.ts` with profile-existence check
13. Update `next.config.mjs` with image remotePatterns

### Wave 3 — Core Components (verify existing, fix if needed)
14. Verify `BloodTypeBadge.tsx` ✓
15. Verify `UrgencyBadge.tsx` ✓
16. Verify `EligibilityBanner.tsx` ✓
17. Verify `SkeletonLoader.tsx` ✓
18. Verify `EmptyState.tsx` ✓
19. Verify `StatsCard.tsx` ✓
20. Verify `ActivityFeed.tsx` ✓
21. Verify `RequestCard.tsx` ✓

### Wave 4 — Map & Realtime (verify existing, fix if needed)
22. Verify `DonorMapInner.tsx` (Leaflet, SSR-free) ✓
23. Verify `DonorMap.tsx` (dynamic wrapper) ✓
24. Verify `EmergencyAlert.tsx` (Realtime) ✓
25. Verify `MapErrorBoundary.tsx` ✓

### Wave 5 — Layout & Navigation (verify existing, fix if needed)
26. Verify `UserProfileContext.tsx` ✓
27. Verify `Navbar.tsx` ✓
28. Verify `MobileNav.tsx` ✓
29. Fix `src/app/(dashboard)/layout.tsx` — verify profile-complete redirect logic

### Wave 6 — Dashboard & Pages (verify/build)
30. Verify `src/app/(dashboard)/dashboard/page.tsx` ✓
31. Verify `src/app/(dashboard)/dashboard/AvailabilityToggle.tsx` ✓
32. Build `src/app/(dashboard)/profile/page.tsx` (view own profile)
33. Verify `src/app/(dashboard)/profile/complete/page.tsx` ✓ (move to auth group if needed)
34. Verify `src/app/(dashboard)/requests/page.tsx` ✓
35. Verify `src/app/(dashboard)/requests/new/page.tsx` ✓
36. Verify `src/app/(dashboard)/requests/[id]/page.tsx` ✓
37. Verify `src/app/(dashboard)/donors/page.tsx` ✓
38. Verify `src/app/(dashboard)/donors/[id]/page.tsx` ✓
39. Verify `src/app/(dashboard)/history/page.tsx` ✓
40. Verify `src/app/(dashboard)/notifications/page.tsx` ✓
41. Verify `src/app/(dashboard)/inventory/page.tsx` ✓

### Wave 7 — Admin Portal (build)
42. Build `src/app/(dashboard)/admin/page.tsx` (admin dashboard with charts)
43. Build `src/app/(dashboard)/admin/users/page.tsx`
44. Build `src/components/admin/AdminUsersTable.tsx`
45. Build `src/app/(dashboard)/admin/requests/page.tsx`

### Wave 8 — Landing Page & Polish
46. Verify `src/app/page.tsx` (landing page) ✓
47. Add meta tags, OG tags to layout.tsx
48. Test all routes end-to-end

### Wave 9 — Deployment
49. Push to GitHub
50. Connect Vercel to repo
51. Add all env vars in Vercel dashboard
52. Add production URL to Supabase Auth redirect URLs
53. Test production OAuth flow

---

## 19. Supabase Dashboard Setup Checklist

- [ ] Project created at supabase.com
- [ ] Run all SQL from Section 3 in SQL Editor
- [ ] Authentication → Providers → Google → Enabled with OAuth credentials from Google Cloud Console
- [ ] Authentication → URL Configuration → Site URL set
- [ ] Authentication → URL Configuration → Redirect URLs include `/auth/callback` for all environments
- [ ] Database → Replication → Enable Realtime for: `blood_requests`, `notifications`, `donor_responses`
- [ ] Storage → Create `avatars` bucket (public)
- [ ] Storage → Create `certificates` bucket (public)
- [ ] Database → Extensions → Enable `pg_cron`
- [ ] Run the pg_cron schedule from Section 3.12

---

## 20. Quick Reference — Key Patterns

### Supabase Server Query Pattern
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function MyPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data } = await supabase
    .from('table_name')
    .select('*')
    .eq('user_id', user.id)

  return <ClientComponent data={data ?? []} />
}
```

### Supabase Client Mutation Pattern
```typescript
'use client'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

const handleUpdate = async () => {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ field: value })
    .eq('id', userId)

  if (error) {
    toast.error(error.message)
    return
  }
  toast.success('Updated successfully!')
}
```

### Haversine Distance Check
```typescript
import { haversineKm } from '@/lib/utils'

const distKm = haversineKm(
  profile.latitude,   // may be undefined → returns Infinity
  profile.longitude,
  request.latitude,   // definitely a number
  request.longitude
)

if (distKm > 10) return // outside 10km radius
```

### Dynamic Map Import (Always Use This Pattern)
```typescript
// DonorMap.tsx
const DonorMapInner = dynamic(() => import('./DonorMapInner'), {
  ssr: false,
  loading: () => <SkeletonLoader variant="map" />,
})
```

---

*End of BloodLink Complete Project Specification*
*Version 1.0 — Generated June 2026*