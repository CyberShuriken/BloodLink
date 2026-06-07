import { z } from 'zod'

// ============================================================
// Shared reusable field definitions
// ============================================================

const bloodTypeEnum = z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])

const divisionEnum = z.enum([
  'Dhaka',
  'Chittagong',
  'Rajshahi',
  'Khulna',
  'Barisal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
])

const bangladeshiPhoneRegex = /^(\+88)?01[3-9]\d{8}$/

// ============================================================
// loginSchema — Requirements 4.1
// ============================================================

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

// ============================================================
// registerSchema — Requirements 4.1
// ============================================================

export const registerSchema = z
  .object({
    full_name: z.string().min(2, 'Full name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords don't match",
    path: ['confirm_password'],
  })

// ============================================================
// profileCompleteSchema — Requirements 4.2, 4.6
// ============================================================

export const profileCompleteSchema = z.object({
  student_id: z.string().min(1, 'Student ID is required'),
  department: z.string().min(1, 'Department is required'),
  batch: z.string().regex(/^\d{4}$/, 'Batch must be a 4-digit year'),
  blood_type: bloodTypeEnum,
  contact_number: z
    .string()
    .regex(bangladeshiPhoneRegex, 'Invalid Bangladeshi phone number'),
  present_address: z
    .string()
    .min(10, 'Address must be at least 10 characters'),
  present_district: z.string().min(1, 'District is required'),
  present_division: divisionEnum,
  permanent_address: z
    .string()
    .min(10, 'Address must be at least 10 characters'),
  permanent_district: z.string().min(1, 'District is required'),
  permanent_division: divisionEnum,
  bio: z.string().max(300, 'Bio must be 300 characters or less').optional(),
})

// ============================================================
// bloodRequestSchema — Requirements 4.3, 4.5
// ============================================================

export const bloodRequestSchema = z.object({
  patient_name: z.string().min(2, 'Patient name must be at least 2 characters'),
  blood_type: bloodTypeEnum,
  units_needed: z
    .number()
    .int('Units must be a whole number')
    .min(1, 'At least 1 unit required')
    .max(10, 'Maximum 10 units'),
  urgency: z.enum(['critical', 'urgent', 'normal']),
  hospital_name: z
    .string()
    .min(2, 'Hospital name must be at least 2 characters'),
  hospital_address: z
    .string()
    .min(10, 'Hospital address must be at least 10 characters'),
  district: z.string().min(1, 'District is required'),
  division: divisionEnum,
  contact_number: z
    .string()
    .regex(bangladeshiPhoneRegex, 'Invalid Bangladeshi phone number'),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  needed_before: z
    .string()
    .datetime({ offset: true })
    .optional()
    .or(z.literal('')),
})

// ============================================================
// donorResponseSchema — Requirements 4.4
// ============================================================

export const donorResponseSchema = z.object({
  message: z.string().max(300, 'Message must be 300 characters or less').optional(),
})

// ============================================================
// Inferred TypeScript types — Requirements 4.4
// ============================================================

export type RegisterInput = z.infer<typeof registerSchema>
export type ProfileCompleteInput = z.infer<typeof profileCompleteSchema>
export type BloodRequestInput = z.infer<typeof bloodRequestSchema>
export type DonorResponseInput = z.infer<typeof donorResponseSchema>
