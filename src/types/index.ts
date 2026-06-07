import type { LucideIcon } from 'lucide-react'

// ============================================================
// Union Types
// ============================================================

export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'

export type UserRole = 'donor' | 'patient' | 'hospital_staff' | 'blood_bank_admin' | 'admin'

export type RequestStatus =
  | 'open'
  | 'partially_fulfilled'
  | 'fulfilled'
  | 'cancelled'
  | 'expired'

export type ResponseStatus =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'completed'
  | 'no_show'

export type UrgencyLevel = 'critical' | 'urgent' | 'normal'

// ============================================================
// Profile — mirrors `profiles` Supabase table
// ============================================================

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole

  // Student / donor-specific fields
  student_id?: string
  department?: string
  batch?: string
  contact_number?: string
  blood_type?: BloodType

  // Address
  present_address?: string
  present_district?: string
  present_division?: string
  permanent_address?: string
  permanent_district?: string
  permanent_division?: string

  // Coordinates for geo-matching
  latitude?: number
  longitude?: number

  // Donor status
  is_eligible: boolean
  last_donation_date?: string | null
  total_donations: number
  is_available: boolean

  // Profile metadata
  avatar_url?: string
  bio?: string
  is_profile_complete: boolean
  is_verified: boolean

  created_at: string
  updated_at: string
}

// ============================================================
// BloodRequest — mirrors `blood_requests` Supabase table
// ============================================================

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
  latitude?: number | null
  longitude?: number | null

  contact_number: string
  description?: string | null
  needed_before?: string | null

  created_at: string
  updated_at: string
  expires_at: string

  // Optional joined relation
  profiles?: Profile
}

// ============================================================
// DonorResponse — mirrors `donor_responses` Supabase table
// ============================================================

export interface DonorResponse {
  id: string
  request_id: string
  donor_id: string
  status: ResponseStatus
  message?: string | null
  responded_at: string
  completed_at?: string | null

  // Optional joined relations
  profiles?: Profile
  blood_requests?: BloodRequest
}

// ============================================================
// Donation — mirrors `donations` Supabase table
// ============================================================

export interface Donation {
  id: string
  donor_id: string
  request_id?: string | null
  response_id?: string | null
  hospital_name: string
  blood_type: BloodType
  units_donated: number
  donated_at: string
  certificate_url?: string | null
  notes?: string | null
  created_at: string
}

// ============================================================
// Notification — mirrors `notifications` Supabase table
// ============================================================

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: 'emergency' | 'response' | 'system' | 'reminder'
  is_read: boolean
  link?: string | null
  created_at: string
}

// ============================================================
// BloodInventory — mirrors `blood_inventory` Supabase table
// ============================================================

export interface BloodInventory {
  id: string
  managed_by: string
  institution_name: string
  blood_type: BloodType
  units_available: number
  low_stock_threshold: number
  updated_at: string
}

// ============================================================
// UI Types
// ============================================================

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badge?: number
}

export interface DashboardStats {
  totalDonations: number
  liveRequestsNearby: number
  nextEligibleDate: string | null
  donorRank: string
}
