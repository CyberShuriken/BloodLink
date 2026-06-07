import type { BloodType, UrgencyLevel } from '@/types'

// ============================================================
// Blood Types
// ============================================================

export const BLOOD_TYPES = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-',
] as const

// ============================================================
// Blood Compatibility Matrix (ABO + Rh)
// Key: donor blood type → Value: recipient blood types they can donate to
// ============================================================

export const BLOOD_COMPATIBILITY: Record<string, string[]> = {
  'O-':  ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // universal donor
  'O+':  ['A+', 'B+', 'AB+', 'O+'],
  'A-':  ['A+', 'A-', 'AB+', 'AB-'],
  'A+':  ['A+', 'AB+'],
  'B-':  ['B+', 'B-', 'AB+', 'AB-'],
  'B+':  ['B+', 'AB+'],
  'AB-': ['AB+', 'AB-'],
  'AB+': ['AB+'], // universal recipient but donates only to AB+
}

// ============================================================
// Bangladesh Divisions and Districts
// ============================================================

export const DIVISIONS_DISTRICTS: Record<string, string[]> = {
  Dhaka: [
    'Dhaka', 'Gazipur', 'Manikganj', 'Munshiganj', 'Narayanganj', 'Narsingdi',
    'Tangail', 'Kishoreganj', 'Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur',
    'Faridpur', 'Gopalganj', 'Madaripur', 'Rajbari', 'Shariatpur',
  ],
  Chittagong: [
    'Chittagong', "Cox's Bazar", 'Feni', 'Lakshmipur', 'Noakhali', 'Comilla',
    'Chandpur', 'Brahmanbaria', 'Khagrachari', 'Rangamati', 'Bandarban',
  ],
  Rajshahi: [
    'Rajshahi', 'Bogura', 'Chapai Nawabganj', 'Joypurhat', 'Naogaon',
    'Natore', 'Pabna', 'Sirajganj',
  ],
  Khulna: [
    'Khulna', 'Bagerhat', 'Chuadanga', 'Jessore', 'Jhenaidah', 'Kushtia',
    'Magura', 'Meherpur', 'Narail', 'Satkhira',
  ],
  Barisal: [
    'Barisal', 'Barguna', 'Bhola', 'Jhalokati', 'Patuakhali', 'Pirojpur',
  ],
  Sylhet: [
    'Sylhet', 'Habiganj', 'Moulvibazar', 'Sunamganj',
  ],
  Rangpur: [
    'Rangpur', 'Dinajpur', 'Gaibandha', 'Kurigram', 'Lalmonirhat',
    'Nilphamari', 'Panchagarh', 'Thakurgaon',
  ],
  Mymensingh: [
    'Mymensingh', 'Jamalpur', 'Netrokona', 'Sherpur',
  ],
}

// ============================================================
// University / College Departments
// ============================================================

export const DEPARTMENTS: string[] = [
  'Computer Science & Engineering',
  'Electrical & Electronic Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Business Administration',
  'Economics',
  'English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Medicine',
  'Pharmacy',
  'Law',
  'Architecture',
  'Agriculture',
]

// ============================================================
// Urgency Configuration
// ============================================================

export const URGENCY_CONFIG: Record<UrgencyLevel, { label: string; color: string; icon: string }> = {
  critical: { label: 'Critical', color: 'bg-red-600 text-white',    icon: '🚨' },
  urgent:   { label: 'Urgent',   color: 'bg-orange-500 text-white', icon: '⚠️' },
  normal:   { label: 'Normal',   color: 'bg-blue-500 text-white',   icon: 'ℹ️' },
}

// ============================================================
// Blood Type Colors (Tailwind classes)
// ============================================================

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

// ============================================================
// Donation Cooldown
// ============================================================

export const DONATION_COOLDOWN_DAYS = 90
