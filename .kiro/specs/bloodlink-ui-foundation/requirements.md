# Requirements Document

## Introduction

The `bloodlink-ui-foundation` feature establishes the complete front-end foundation for the BloodLink emergency blood donation and coordination platform. This includes the root Next.js layout, the global responsive navigation system, the Donor Dashboard view, all supporting UI components (badges, banners, maps, alerts, skeleton loaders), the TypeScript type definitions, Zod validation schemas, and the Tailwind CSS blood-themed design system.

The stack is Next.js 14 (App Router) with TypeScript, Tailwind CSS, Shadcn UI, Lucide React, Leaflet.js / React-Leaflet, Supabase (auth, DB, realtime), React Hook Form + Zod, and Sonner for toast notifications.

---

## Glossary

- **App**: The BloodLink Next.js 14 application.
- **RootLayout**: The top-level `src/app/layout.tsx` component that wraps every page.
- **Navbar**: The horizontal desktop navigation bar rendered inside the `DashboardLayout`.
- **MobileNav**: The sticky bottom navigation bar and/or sliding hamburger drawer for mobile/tablet viewports.
- **DashboardLayout**: The route-group layout at `src/app/(dashboard)/layout.tsx` that composes `Navbar` and `MobileNav` around page content.
- **DonorDashboard**: The page component at `src/app/(dashboard)/dashboard/page.tsx` for users with the `donor` role.
- **DonorMap**: The Leaflet.js interactive map component that displays nearby blood requests as markers.
- **BloodTypeBadge**: A shared component that renders a visually distinct badge for a given `BloodType` value.
- **UrgencyBadge**: A shared component that renders a color-coded badge for a given `UrgencyLevel` value.
- **EligibilityBanner**: A dashboard component that informs a donor of their next eligible donation date.
- **StatsCard**: A reusable dashboard card component that displays a numeric metric with a label and icon.
- **EmergencyAlert**: A real-time toast/banner component that triggers when a critical blood request matches the donor's blood type within a 10 km radius.
- **SkeletonLoader**: An accessible Tailwind-based loading placeholder rendered while async data is fetching.
- **AvailabilityToggle**: The prominent crimson toggle button on the Donor Dashboard that switches the donor's `is_available` status.
- **NotificationBell**: The Navbar icon that displays an unread notification count badge.
- **Profile**: The TypeScript interface describing a BloodLink user profile row (from `src/types/index.ts`).
- **BloodRequest**: The TypeScript interface describing a blood request row.
- **BloodType**: The union type `'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'`.
- **UrgencyLevel**: The union type `'critical' | 'urgent' | 'normal'`.
- **UserRole**: The union type `'donor' | 'patient' | 'hospital_staff' | 'blood_bank_admin' | 'admin'`.
- **RequestStatus**: The union type `'open' | 'partially_fulfilled' | 'fulfilled' | 'cancelled' | 'expired'`.
- **ResponseStatus**: The union type `'pending' | 'accepted' | 'rejected' | 'completed' | 'no_show'`.
- **BloodTheme**: The blood-themed color palette anchored on Deep Crimson Red `#C41E3A`.
- **Geist_Sans / Geist_Mono**: The locally-hosted Geist font families already present in `src/app/fonts/`.
- **Supabase_Realtime**: The Supabase real-time subscription channel used to stream new `blood_requests` rows.
- **Zod_Schema**: A runtime validation schema created with the `zod` library.
- **EARS**: Easy Approach to Requirements Syntax — the structured requirement patterns used in this document.

---

## Requirements

---

### Requirement 1: Root Layout Setup

**User Story:** As a developer, I want a fully configured root layout so that every page inherits the correct fonts, metadata, theme providers, and Sonner toast infrastructure.

#### Acceptance Criteria

1. THE `RootLayout` SHALL set the HTML `lang` attribute to `"en"`.
2. THE `RootLayout` SHALL apply the `Geist_Sans` local font variable `--font-geist-sans` and the `Geist_Mono` local font variable `--font-geist-mono` to the `<body>` element via `className`.
3. THE `RootLayout` SHALL export a `Metadata` object with `title` set to `"BloodLink — Emergency Blood Coordination"` and `description` set to `"Connect donors, hospitals, and blood banks in one coordinated network"`.
4. THE `RootLayout` SHALL render a `<ThemeProvider>` from `next-themes` wrapping all children, with `attribute="class"` and `defaultTheme="light"`.
5. THE `RootLayout` SHALL render a `<Toaster>` component from `sonner` inside the body so that toast notifications are available on every page.
6. IF the `next-themes` `ThemeProvider` or `sonner` `Toaster` is missing from the layout, THEN THE `App` SHALL fail the TypeScript build with a type error for missing providers.
7. THE `RootLayout` SHALL include a `<meta name="viewport" content="width=device-width, initial-scale=1" />` tag to ensure correct scaling on mobile devices.

---

### Requirement 2: Tailwind BloodTheme Configuration

**User Story:** As a developer, I want the Tailwind configuration extended with BloodLink-specific color tokens so that components reference semantic design tokens rather than hard-coded hex values.

#### Acceptance Criteria

1. THE `tailwind.config.ts` file SHALL add a `blood` color scale to `theme.extend.colors` containing at minimum: `blood.DEFAULT` (`#C41E3A`), `blood.dark` (`#8B0000`), `blood.light` (`#F5C6CE`), and `blood.muted` (`#FDF0F2`).
2. THE `tailwind.config.ts` file SHALL add a `crimson` alias pointing to `#C41E3A` so that class names such as `bg-crimson` and `text-crimson` resolve correctly.
3. THE `globals.css` `:root` block SHALL define `--primary` as `0 75% 42%` (HSL for `#C41E3A`) so that the `primary` Shadcn token maps to the BloodTheme.
4. THE `globals.css` `:root` block SHALL define `--ring` as `0 75% 42%` so that focus rings use the BloodTheme primary color.
5. THE `globals.css` `:root` block SHALL define `--radius` as `0.75rem` for consistent rounded corners.
6. THE `globals.css` file SHALL define custom CSS properties `--blood-red: #C41E3A`, `--blood-dark: #8B0000`, `--blood-light: #F5C6CE`, and `--blood-muted: #FDF0F2` in `:root` for use in non-Tailwind CSS contexts.
7. THE `tailwind.config.ts` SHALL add keyframe animations `pulse-crimson` (scale 1 → 1.05 → 1 with opacity change) and `flash-red` (opacity 1 → 0.6 → 1) to `theme.extend.keyframes` and corresponding entries in `theme.extend.animation` for the `EmergencyAlert` component.

---

### Requirement 3: TypeScript Type Definitions

**User Story:** As a developer, I want all domain types defined in `src/types/index.ts` so that every component has compile-time safety over blood request, profile, and notification data.

#### Acceptance Criteria

1. THE `src/types/index.ts` file SHALL export `BloodType`, `UserRole`, `RequestStatus`, `ResponseStatus`, and `UrgencyLevel` as TypeScript string union types matching the values defined in the Glossary.
2. THE `src/types/index.ts` file SHALL export a `Profile` interface with all fields matching the `profiles` Supabase table schema, including optional fields marked with `?`.
3. THE `src/types/index.ts` file SHALL export a `BloodRequest` interface with all fields matching the `blood_requests` Supabase table schema, including an optional joined `profiles` field typed as `Profile`.
4. THE `src/types/index.ts` file SHALL export `DonorResponse`, `Donation`, `Notification`, and `BloodInventory` interfaces matching their respective Supabase table schemas.
5. WHEN a component imports any type from `src/types/index.ts`, THE TypeScript compiler SHALL resolve the import without errors.
6. THE `src/types/index.ts` file SHALL export a `NavItem` interface with fields `label: string`, `href: string`, `icon: LucideIcon`, and optional `badge?: number`, for use by the `Navbar` and `MobileNav` components.
7. THE `src/types/index.ts` file SHALL export a `DashboardStats` interface with fields `totalDonations: number`, `liveRequestsNearby: number`, `nextEligibleDate: string | null`, and `donorRank: string`, for use by `StatsCard`.

---

### Requirement 4: Zod Validation Schemas

**User Story:** As a developer, I want all form validation rules defined with Zod in `src/lib/validations.ts` so that form inputs are validated consistently at runtime across all forms.

#### Acceptance Criteria

1. THE `src/lib/validations.ts` file SHALL export a `registerSchema` that validates `email` (valid email string), `password` (minimum 8 characters), and `full_name` (minimum 2 characters).
2. THE `src/lib/validations.ts` file SHALL export a `profileCompleteSchema` that validates `student_id`, `department`, `batch` (4-digit year string), `blood_type` (one of `BloodType` values), `contact_number` (Bangladeshi phone format `^(\+88)?01[3-9]\d{8}$`), `present_address` (minimum 10 characters), `present_district`, `present_division` (one of the 8 Bangladesh divisions), `permanent_address`, `permanent_district`, `permanent_division`, and optional `bio` (maximum 300 characters).
3. THE `src/lib/validations.ts` file SHALL export a `bloodRequestSchema` that validates `patient_name` (minimum 2 characters), `blood_type`, `units_needed` (integer 1–10), `urgency` (one of `UrgencyLevel` values), `hospital_name` (minimum 2 characters), `hospital_address` (minimum 10 characters), `district`, `division`, `contact_number`, and optional `description` (maximum 500 characters) and `needed_before` (ISO date string).
4. THE `src/lib/validations.ts` file SHALL export `RegisterInput`, `ProfileCompleteInput`, `BloodRequestInput`, and `DonorResponseInput` TypeScript types inferred from their respective schemas using `z.infer`.
5. WHEN `bloodRequestSchema` receives `units_needed` less than 1 or greater than 10, THE Zod_Schema SHALL return a validation error with a descriptive message.
6. WHEN `profileCompleteSchema` receives a `contact_number` that does not match the Bangladeshi phone regex, THE Zod_Schema SHALL return the message `"Invalid Bangladeshi phone number"`.

---

### Requirement 5: Global Responsive Navbar — Desktop

**User Story:** As an authenticated user on desktop, I want a horizontal top navigation bar so that I can quickly navigate to core sections of the application.

#### Acceptance Criteria

1. THE `Navbar` component SHALL render as a sticky horizontal bar fixed to the top of the viewport on screens with a minimum width of 768 px (`md` breakpoint and above).
2. THE `Navbar` SHALL display the BloodLink logo (a blood-drop SVG icon) and the text `"BloodLink"` in a bold `text-blood` color on the left side.
3. THE `Navbar` SHALL render navigation links for `Dashboard`, `Find Donors`, `Requests`, `History`, and `Notifications` using `<Link>` components from Next.js.
4. THE `Navbar` SHALL highlight the currently active route link with a crimson underline and `font-semibold` weight using Next.js `usePathname`.
5. THE `Navbar` SHALL render a `NotificationBell` icon (Lucide `Bell`) on the right side with a red circular badge displaying the unread notification count WHEN the count is greater than 0.
6. THE `Navbar` SHALL render a user profile `Avatar` dropdown on the right side containing options: `My Profile`, `Settings`, and `Sign Out`.
7. THE `Navbar` SHALL be hidden on screens below the `md` breakpoint to avoid overlap with `MobileNav`.
8. WHEN the `Sign Out` option in the profile dropdown is selected, THE `Navbar` SHALL call the Supabase `signOut` method and redirect the user to `/login`.

---

### Requirement 6: Global Responsive Navigation — Mobile / Tablet

**User Story:** As an authenticated user on mobile or tablet, I want a thumb-friendly bottom navigation bar so that I can access core actions without reaching to the top of the screen.

#### Acceptance Criteria

1. THE `MobileNav` component SHALL render as a sticky bottom navigation bar fixed to the bottom of the viewport on screens below the `md` breakpoint.
2. THE `MobileNav` SHALL display icon-and-label tabs for `Home` (Lucide `Home`), `Requests` (Lucide `Droplet`), `Find Donors` (Lucide `Users`), and `Profile` (Lucide `User`).
3. THE `MobileNav` SHALL highlight the active tab with a `text-blood` color and a small crimson indicator dot above the icon WHEN that route is active.
4. THE `MobileNav` SHALL render a prominent crimson circular `+` button (Lucide `Plus`) centered above the tab bar as a quick-action shortcut that navigates to `/requests/new`.
5. THE `MobileNav` SHALL be hidden on screens at or above the `md` breakpoint.
6. THE `DashboardLayout` SHALL also include a `Sheet`-based sliding hamburger drawer accessible from a `Menu` icon in the top-left corner on mobile viewports, exposing the full navigation link list for less-common routes such as `History` and `Notifications`.
7. THE `MobileNav` SHALL display a red badge counter on the `Profile` tab icon WHEN there are unread notifications, showing a count capped at 99.

---

### Requirement 7: Dashboard Layout

**User Story:** As an authenticated user, I want a consistent shell layout for all dashboard pages so that navigation and page content are always structured correctly.

#### Acceptance Criteria

1. THE `DashboardLayout` at `src/app/(dashboard)/layout.tsx` SHALL render `Navbar` for desktop and `MobileNav` for mobile within a single layout component using responsive Tailwind classes.
2. THE `DashboardLayout` SHALL wrap page content in a `<main>` element with `pb-20 md:pb-0` padding to prevent mobile content from being obscured by the sticky `MobileNav`.
3. THE `DashboardLayout` SHALL fetch the authenticated user's `Profile` from Supabase on the server and pass it to layout children via a React context provider named `UserProfileContext`.
4. IF no authenticated user session is found, THEN THE `DashboardLayout` SHALL redirect to `/login` using `next/navigation`'s `redirect()`.
5. THE `DashboardLayout` SHALL render conditionally based on `UserRole`: admin-only links SHALL be visible only when `profile.role === 'admin'`, and inventory links only when `profile.role === 'hospital_staff'` or `profile.role === 'blood_bank_admin'`.

---

### Requirement 8: Donor Dashboard — Mobile View

**User Story:** As a donor on a mobile device, I want a vertically stacked dashboard so that I can see my availability, nearby emergencies, and eligibility status at a glance with one hand.

#### Acceptance Criteria

1. THE `DonorDashboard` SHALL render in a single-column vertical stack on screens below the `md` breakpoint.
2. THE `AvailabilityToggle` SHALL be the first element in the mobile stack, displaying `"GO AVAILABLE"` in white text on a filled crimson (`bg-blood`) background WHEN `profile.is_available` is `false`, and `"OFF DUTY"` on a slate background WHEN `profile.is_available` is `true`.
3. WHEN the `AvailabilityToggle` is tapped, THE `DonorDashboard` SHALL call the Supabase `update` API on the `profiles` table to toggle `is_available` for the current user.
4. THE `DonorDashboard` SHALL render an `EligibilityBanner` below the `AvailabilityToggle`, displaying the next eligible donation date calculated as `last_donation_date + 90 days` WHEN `profile.is_eligible` is `false`.
5. THE `DonorDashboard` SHALL render a scrollable list of `RequestCard` components showing active (status `'open'`) blood requests, labeled `"Nearby Emergency Alerts"`, sorted by urgency level (`critical` first).
6. WHEN no active requests are present, THE `DonorDashboard` SHALL render an `EmptyState` component with the message `"No active emergencies nearby. You're all caught up!"`.
7. THE `DonorDashboard` mobile view SHALL render `SkeletonLoader` placeholders for the requests list WHILE the Supabase data fetch is in progress.

---

### Requirement 9: Donor Dashboard — Desktop View

**User Story:** As a donor on desktop, I want a three-column dashboard layout so that I can simultaneously view my profile stats, the interactive map, and my donation history.

#### Acceptance Criteria

1. THE `DonorDashboard` SHALL render in a three-column CSS grid (`grid-cols-3`) on screens at or above the `lg` breakpoint.
2. THE left column SHALL contain the donor's `Avatar`, `full_name`, `blood_type` rendered by `BloodTypeBadge`, and a row of `StatsCard` components displaying `Total Donations`, `Requests Nearby`, and `Donor Rank`.
3. THE center column SHALL contain the `DonorMap` component rendered as a `Leaflet` map with a minimum height of 400 px, showing the donor's location and nearby open blood requests as map markers.
4. THE right column SHALL contain a scrollable `ActivityFeed` listing the donor's past `Donation` records with date, hospital name, blood type, and units donated.
5. THE `DonorDashboard` desktop view SHALL render `SkeletonLoader` placeholders for the center map column and right activity column WHILE data is loading.
6. THE left column SHALL include the `AvailabilityToggle` button below the stats cards so that desktop users can also change their availability status.
7. THE `DonorMap` center column SHALL show an `EmptyState` message `"Unable to load map"` IF the `DonorMap` component throws a rendering error (via an error boundary).

---

### Requirement 10: DonorMap (Leaflet)

**User Story:** As a donor, I want an interactive map of nearby blood requests so that I can visually assess distance and urgency before deciding to respond.

#### Acceptance Criteria

1. THE `DonorMap` component SHALL render a Leaflet map using `react-leaflet`'s `MapContainer`, `TileLayer`, and `Marker` components with OpenStreetMap tile URLs.
2. THE `DonorMap` SHALL be dynamically imported with `next/dynamic` and `ssr: false` so that Leaflet's browser-only APIs do not cause a server-side render error.
3. THE `DonorMap` SHALL place a marker at the donor's coordinates (`profile.latitude`, `profile.longitude`) using a distinct blue icon indicating the donor's own location.
4. FOR EACH `BloodRequest` with a non-null `latitude` and `longitude`, THE `DonorMap` SHALL render a marker with a color derived from `urgency`: red for `critical`, orange for `urgent`, and blue for `normal`.
5. WHEN a request marker is clicked, THE `DonorMap` SHALL display a Leaflet `Popup` containing the `hospital_name`, `blood_type`, `urgency`, and a `"Respond"` button that navigates to `/requests/[id]`.
6. IF `profile.latitude` or `profile.longitude` is null, THEN THE `DonorMap` SHALL center the map on Dhaka, Bangladesh (coordinates 23.8103, 90.4125) as a default.
7. THE `DonorMap` SHALL import and apply the Leaflet default icon fix (`import 'leaflet/dist/leaflet.css'` and icon image overrides) to prevent broken marker icons in Next.js.

---

### Requirement 11: BloodTypeBadge Component

**User Story:** As a user, I want blood types rendered as visually distinct badges so that I can identify blood type at a glance in any list or card.

#### Acceptance Criteria

1. THE `BloodTypeBadge` component SHALL accept a `bloodType` prop of type `BloodType` and an optional `size` prop of `'sm' | 'md' | 'lg'` defaulting to `'md'`.
2. THE `BloodTypeBadge` SHALL apply a unique background and text color per `BloodType` using the `BLOOD_TYPE_COLORS` map from `src/lib/constants.ts`.
3. THE `BloodTypeBadge` SHALL render the blood type text in a bold, monospace font inside a rounded pill element.
4. THE `BloodTypeBadge` SHALL include an `aria-label` of `"Blood type [value]"` for screen reader accessibility.
5. WHEN `size` is `'lg'`, THE `BloodTypeBadge` SHALL increase the font size to `text-lg` and padding to `px-4 py-2`.

---

### Requirement 12: UrgencyBadge Component

**User Story:** As a user, I want urgency levels rendered as color-coded badges so that critical requests stand out immediately in any view.

#### Acceptance Criteria

1. THE `UrgencyBadge` component SHALL accept an `urgency` prop of type `UrgencyLevel`.
2. THE `UrgencyBadge` SHALL render `"Critical"` with a `bg-red-600 text-white` style and a `🚨` icon, `"Urgent"` with `bg-orange-500 text-white` and a `⚠️` icon, and `"Normal"` with `bg-blue-500 text-white` and an `ℹ️` icon.
3. THE `UrgencyBadge` SHALL include `role="status"` and `aria-label="Urgency: [level]"` for accessibility.
4. WHEN `urgency` is `'critical'`, THE `UrgencyBadge` SHALL also apply a subtle CSS `animate-pulse` animation to draw attention.

---

### Requirement 13: EligibilityBanner Component

**User Story:** As a donor, I want a clear banner showing my next eligible donation date so that I know exactly when I can donate again.

#### Acceptance Criteria

1. THE `EligibilityBanner` component SHALL accept `lastDonationDate: string | null` and `isEligible: boolean` props.
2. WHEN `isEligible` is `true`, THE `EligibilityBanner` SHALL render a green success banner with the message `"You are eligible to donate!"` and a `CheckCircle` Lucide icon.
3. WHEN `isEligible` is `false` and `lastDonationDate` is not null, THE `EligibilityBanner` SHALL render a yellow warning banner displaying `"Next eligible date: [date]"` where `[date]` is `lastDonationDate + 90 days` formatted as `"DD MMM YYYY"` using `date-fns`.
4. WHEN `lastDonationDate` is null and `isEligible` is `false`, THE `EligibilityBanner` SHALL render the message `"Eligibility status is being reviewed"`.
5. THE `EligibilityBanner` SHALL include `role="alert"` and `aria-live="polite"` so that screen readers announce changes to eligibility status.

---

### Requirement 14: StatsCard Component

**User Story:** As a user, I want clearly designed statistic cards on the dashboard so that I can quickly read key numbers at a glance.

#### Acceptance Criteria

1. THE `StatsCard` component SHALL accept `title: string`, `value: string | number`, `icon: LucideIcon`, and optional `description: string` and `trend: 'up' | 'down' | 'neutral'` props.
2. THE `StatsCard` SHALL render the `icon` in a small crimson-tinted circle container alongside the `value` in a large bold font and `title` in muted text.
3. WHEN `trend` is `'up'`, THE `StatsCard` SHALL render a green `TrendingUp` Lucide icon with the `description` text in `text-green-600`.
4. WHEN `trend` is `'down'`, THE `StatsCard` SHALL render a red `TrendingDown` Lucide icon with the `description` text in `text-red-600`.
5. THE `StatsCard` SHALL apply a subtle hover shadow transition (`hover:shadow-md transition-shadow duration-200`) for interactivity feedback.

---

### Requirement 15: EmergencyAlert (Real-Time Toast) Component

**User Story:** As a donor who is available, I want a flashing real-time alert when a critical blood request matching my blood type appears within 10 km so that I can respond immediately.

#### Acceptance Criteria

1. THE `EmergencyAlert` component SHALL subscribe to the Supabase `blood_requests` Realtime channel using `supabase.channel('blood_requests').on('postgres_changes', ...)` WHEN the component mounts.
2. WHEN a new `blood_requests` row is received with `urgency = 'critical'` and the requesting hospital's coordinates are within 10 km of the donor's coordinates, THE `EmergencyAlert` SHALL trigger a Sonner toast notification.
3. THE Sonner toast SHALL display a crimson-accented banner with the `hospital_name`, `blood_type`, and a `"Respond Now"` button that navigates to `/requests/[id]`.
4. THE Sonner toast for critical alerts SHALL have a `duration` of 15000 ms (15 seconds) so that the donor has time to act.
5. THE `EmergencyAlert` component SHALL compute distance using the Haversine formula applied to the donor's `latitude`/`longitude` and the request's `latitude`/`longitude`.
6. WHEN `profile.is_available` is `false`, THE `EmergencyAlert` SHALL NOT trigger any notifications.
7. WHEN the component unmounts, THE `EmergencyAlert` SHALL call `supabase.removeChannel()` to clean up the Realtime subscription.

---

### Requirement 16: SkeletonLoader Components

**User Story:** As a user, I want skeleton loading states for map and data table areas so that the interface feels fast and accessible while data loads.

#### Acceptance Criteria

1. THE `SkeletonLoader` component SHALL accept a `variant` prop of `'card' | 'table' | 'map' | 'stats'` that renders an appropriately shaped animated placeholder.
2. WHEN `variant` is `'map'`, THE `SkeletonLoader` SHALL render a rounded rectangle with `animate-pulse bg-muted` at the same minimum height as the `DonorMap` (400 px).
3. WHEN `variant` is `'table'`, THE `SkeletonLoader` SHALL render 5 rows of alternating muted-gray bars simulating a data table.
4. WHEN `variant` is `'stats'`, THE `SkeletonLoader` SHALL render 3 side-by-side card placeholders matching the `StatsCard` layout.
5. THE `SkeletonLoader` SHALL include `aria-hidden="true"` so that screen readers do not announce skeleton content, and a visually-hidden `<span>` with text `"Loading..."` for assistive technologies.

---

### Requirement 17: RequestCard Component

**User Story:** As a donor, I want each nearby blood request shown as a clear card so that I can assess the urgency, blood type, and location before tapping to respond.

#### Acceptance Criteria

1. THE `RequestCard` component SHALL accept a `request: BloodRequest` prop and render the `hospital_name`, `district`, `blood_type` (via `BloodTypeBadge`), `urgency` (via `UrgencyBadge`), `units_needed`, and time elapsed since `created_at`.
2. WHEN `request.urgency` is `'critical'`, THE `RequestCard` SHALL apply a left crimson border accent (`border-l-4 border-blood`) and a faint red background (`bg-blood-muted`) to visually differentiate critical cards.
3. THE `RequestCard` SHALL render a `"View Details"` button that navigates to `/requests/[request.id]`.
4. THE `RequestCard` SHALL render an `aria-label` of `"Blood request at [hospital_name], urgency [urgency], blood type [blood_type]"` on the root element.

---

### Requirement 18: Application Constants

**User Story:** As a developer, I want all magic values centralised in `src/lib/constants.ts` so that I never reference hard-coded strings or numbers directly in components.

#### Acceptance Criteria

1. THE `src/lib/constants.ts` file SHALL export `BLOOD_TYPES`, `BLOOD_COMPATIBILITY`, `DIVISIONS_DISTRICTS`, `DEPARTMENTS`, `URGENCY_CONFIG`, `BLOOD_TYPE_COLORS`, and `DONATION_COOLDOWN_DAYS` matching the definitions in `BLOODLINK_AGENT_SPEC.md` Section 8.
2. THE `DONATION_COOLDOWN_DAYS` constant SHALL be set to `90`.
3. THE `URGENCY_CONFIG` object SHALL map each `UrgencyLevel` to an object with `label`, `color` (Tailwind class string), and `icon` (emoji string) fields.
4. THE `BLOOD_COMPATIBILITY` object SHALL correctly encode the standard ABO + Rh blood compatibility matrix so that `O-` maps to all 8 blood types and `AB+` maps only to `['AB+']`.
