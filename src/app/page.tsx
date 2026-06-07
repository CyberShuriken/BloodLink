import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { BloodTypeBadge } from '@/components/shared/BloodTypeBadge'
import { UrgencyBadge } from '@/components/shared/UrgencyBadge'
import { BLOOD_COMPATIBILITY, BLOOD_TYPES } from '@/lib/constants'
import type { BloodRequest, BloodType } from '@/types'

async function getStats() {
  const supabase = createClient()
  const [donors, donations, requests] = await Promise.all([
    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'donor'),
    supabase.from('donations').select('id', { count: 'exact', head: true }),
    supabase
      .from('blood_requests')
      .select('district', { count: 'exact' })
      .eq('status', 'open'),
  ])
  const districts = new Set((requests.data ?? []).map((r) => r.district)).size
  return {
    totalDonors: donors.count ?? 0,
    totalDonations: donations.count ?? 0,
    districtsActive: districts,
    livesSaved: Math.floor((donations.count ?? 0) * 0.9),
  }
}

async function getCriticalRequests() {
  const supabase = createClient()
  const { data } = await supabase
    .from('blood_requests')
    .select('id, patient_name, blood_type, units_needed, urgency, district, division, created_at, hospital_name')
    .eq('status', 'open')
    .eq('urgency', 'critical')
    .order('created_at', { ascending: false })
    .limit(3)
  return (data ?? []) as Partial<BloodRequest>[]
}

export default async function LandingPage() {
  const [stats, criticalRequests] = await Promise.all([getStats(), getCriticalRequests()])

  const BLOOD_TYPES_LIST = BLOOD_TYPES as readonly BloodType[]

  const testimonials = [
    {
      name: 'Rahim Ahmed',
      department: 'Computer Science & Engineering',
      batch: '2022',
      text: 'BloodLink helped me find a matching donor within 20 minutes for my mother\'s emergency surgery. Truly a lifesaver!',
      bloodType: 'B+',
    },
    {
      name: 'Nadia Islam',
      department: 'Pharmacy',
      batch: '2021',
      text: 'I\'ve donated blood 3 times through BloodLink. The notification system makes it so easy to respond to emergencies.',
      bloodType: 'A+',
    },
    {
      name: 'Karim Hossain',
      department: 'Electrical & Electronic Engineering',
      batch: '2023',
      text: 'As a hospital staff member, BloodLink has transformed how we connect with donors. Response time has dropped significantly.',
      bloodType: 'O-',
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* ── Public Navbar ─────────────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-7 w-7 fill-blood" aria-hidden="true">
              <path d="M12 2C12 2 4 9 4 14a8 8 0 0016 0C20 9 12 2 12 2z" />
            </svg>
            <span className="font-display font-bold text-xl text-blood">BloodLink</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-blood transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center rounded-lg blood-gradient px-4 py-2 text-sm font-semibold text-white shadow hover:opacity-90 transition-opacity"
            >
              Register as Donor
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      <section className="blood-gradient relative overflow-hidden py-24 sm:py-32">
        {/* Background decorative circles */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-white/5" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-white/5" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            {/* Text */}
            <div className="text-center lg:text-left flex-1">
              <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium rounded-full px-4 py-1.5 mb-6">
                <span className="flex h-2 w-2 rounded-full bg-white pulse-ring" />
                Live emergencies in your area
              </div>
              <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Every Drop{' '}
                <span className="text-red-200">Counts.</span>
              </h1>
              <p className="mt-6 text-lg sm:text-xl text-red-100 max-w-xl">
                Connect with nearby student donors in seconds during emergencies. BloodLink bridges
                the gap between patients and donors across Bangladesh.
              </p>
              <div className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <Link
                  href="/donors"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl bg-white text-blood font-semibold px-8 py-3.5 text-base hover:bg-red-50 transition-colors shadow-lg"
                >
                  Find a Donor
                </Link>
                <Link
                  href="/register"
                  className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border-2 border-white text-white font-semibold px-8 py-3.5 text-base hover:bg-white/10 transition-colors"
                >
                  Register as Donor
                </Link>
              </div>
            </div>

            {/* Blood drop animation */}
            <div className="flex-shrink-0 hidden lg:flex items-center justify-center" aria-hidden="true">
              <div className="relative flex items-center justify-center w-48 h-48">
                <div className="absolute w-full h-full rounded-full bg-white/10 pulse-ring" />
                <div className="absolute w-3/4 h-3/4 rounded-full bg-white/10 pulse-ring" style={{ animationDelay: '0.5s' }} />
                <svg viewBox="0 0 100 120" className="w-24 h-24 drop-shadow-xl" aria-label="Blood drop">
                  <path
                    d="M50 5 C50 5 10 45 10 70 C10 92 28 110 50 110 C72 110 90 92 90 70 C90 45 50 5 50 5Z"
                    fill="white"
                    fillOpacity="0.9"
                  />
                  <path
                    d="M50 20 C50 20 25 52 25 70 C25 83 36 92 50 92 C64 92 75 83 75 70 C75 52 50 20 50 20Z"
                    fill="#C41E3A"
                    fillOpacity="0.7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────── */}
      <section className="bg-slate-900 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 text-center">
            {[
              { label: 'Registered Donors', value: stats.totalDonors },
              { label: 'Donations Completed', value: stats.totalDonations },
              { label: 'Districts Active', value: stats.districtsActive },
              { label: 'Lives Saved (Est.)', value: stats.livesSaved },
            ].map((stat) => (
              <div key={stat.label} className="animate-count-up">
                <p className="font-display text-3xl sm:text-4xl font-bold text-white">
                  {stat.value.toLocaleString()}
                </p>
                <p className="text-slate-400 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ──────────────────────────────────────────────── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
              How BloodLink Works
            </h2>
            <p className="mt-4 text-slate-600 max-w-xl mx-auto">
              Three simple steps to save a life.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                title: 'Post Emergency Request',
                desc: 'Family members, patients, or hospital staff post a blood request with urgency level and hospital details.',
                icon: '🩸',
              },
              {
                step: '02',
                title: 'We Match Nearby Donors',
                desc: 'BloodLink instantly alerts eligible donors near the hospital with matching blood types via real-time notifications.',
                icon: '📍',
              },
              {
                step: '03',
                title: 'Donor Responds & Saves a Life',
                desc: 'Donors confirm their availability, show up, donate blood, and earn donation certificates.',
                icon: '❤️',
              },
            ].map((item) => (
              <div
                key={item.step}
                className="relative rounded-2xl border bg-white p-8 shadow-sm hover:shadow-md transition-shadow"
              >
                <span className="font-display text-6xl font-bold text-slate-100 absolute top-4 right-6 select-none">
                  {item.step}
                </span>
                <div className="text-4xl mb-4">{item.icon}</div>
                <h3 className="font-display font-bold text-xl text-slate-900 mb-3">{item.title}</h3>
                <p className="text-slate-600 text-sm leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Blood Type Compatibility Chart ────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
              Blood Type Compatibility
            </h2>
            <p className="mt-4 text-slate-600 max-w-xl mx-auto">
              Not all blood types are compatible. Use this chart to understand who can donate to whom.
            </p>
          </div>
          <div className="overflow-x-auto rounded-2xl border bg-white shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50">
                  <th className="py-3 px-4 text-left font-display font-semibold text-slate-700">Donor ↓ &nbsp; Recipient →</th>
                  {BLOOD_TYPES_LIST.map((bt) => (
                    <th key={bt} className="py-3 px-3 text-center">
                      <BloodTypeBadge bloodType={bt} size="sm" />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {BLOOD_TYPES_LIST.map((donor) => (
                  <tr key={donor} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <BloodTypeBadge bloodType={donor} size="sm" />
                    </td>
                    {BLOOD_TYPES_LIST.map((recipient) => {
                      const canDonate = BLOOD_COMPATIBILITY[donor]?.includes(recipient)
                      return (
                        <td key={recipient} className="py-3 px-3 text-center">
                          {canDonate ? (
                            <span className="text-green-600 font-bold text-base" aria-label={`${donor} can donate to ${recipient}`}>✓</span>
                          ) : (
                            <span className="text-slate-200 text-base" aria-label={`${donor} cannot donate to ${recipient}`}>—</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-center text-xs text-slate-500 mt-4">
            O- is the universal donor. AB+ is the universal recipient.
          </p>
        </div>
      </section>

      {/* ── Recent Critical Requests ──────────────────────────────────── */}
      {criticalRequests.length > 0 && (
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="font-display text-3xl font-bold text-slate-900">
                  🚨 Active Critical Requests
                </h2>
                <p className="text-slate-600 mt-2">These patients need blood urgently right now.</p>
              </div>
              <Link
                href="/requests"
                className="hidden sm:inline-flex items-center gap-1 text-blood font-medium text-sm hover:underline"
              >
                See all requests →
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {criticalRequests.map((req) => (
                <div
                  key={req.id}
                  className="rounded-2xl border-2 border-blood/20 bg-red-50 p-6 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <p className="font-semibold text-slate-900">{req.hospital_name}</p>
                    {req.urgency && <UrgencyBadge urgency={req.urgency} />}
                  </div>
                  <p className="text-slate-500 text-sm">{req.district}, {req.division}</p>
                  <div className="flex items-center gap-2">
                    {req.blood_type && <BloodTypeBadge bloodType={req.blood_type} size="sm" />}
                    <span className="text-sm text-slate-700">{req.units_needed} units needed</span>
                  </div>
                  <Link
                    href={req.id ? `/requests/${req.id}` : '/requests'}
                    className="block mt-2"
                  >
                    <span className="inline-flex w-full items-center justify-center rounded-lg blood-gradient px-4 py-2 text-sm font-semibold text-white hover:opacity-90 transition-opacity">
                      Respond Now
                    </span>
                  </Link>
                </div>
              ))}
            </div>
            <div className="text-center mt-6">
              <Link
                href="/requests"
                className="sm:hidden inline-flex items-center gap-1 text-blood font-medium text-sm hover:underline"
              >
                See all requests →
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ── Testimonials ──────────────────────────────────────────────── */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-slate-900">
              Stories That Matter
            </h2>
            <p className="mt-4 text-slate-600">Real impact from our community.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl bg-white border p-6 space-y-4 shadow-sm">
                <p className="text-slate-700 leading-relaxed text-sm">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full blood-gradient flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {t.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-500 truncate">{t.department}, {t.batch}</p>
                  </div>
                  <BloodTypeBadge bloodType={t.bloodType as BloodType} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Section ───────────────────────────────────────────────── */}
      <section className="blood-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4">
            Join 500+ Student Donors
          </h2>
          <p className="text-red-100 text-lg mb-8">
            Register today. Your blood type might be exactly what someone needs tomorrow.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-white text-blood font-bold px-10 py-4 text-base hover:bg-red-50 transition-colors shadow-xl"
          >
            Register as a Donor — It&apos;s Free
          </Link>
        </div>
      </section>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="bg-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-blood" aria-hidden="true">
                <path d="M12 2C12 2 4 9 4 14a8 8 0 0016 0C20 9 12 2 12 2z" />
              </svg>
              <span className="font-display font-bold text-white text-lg">BloodLink</span>
              <span className="text-slate-400 text-sm ml-2">Connecting donors, saving lives.</span>
            </div>
            <nav className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
              <Link href="/donors" className="hover:text-white transition-colors">Find Donors</Link>
              <Link href="/requests" className="hover:text-white transition-colors">Requests</Link>
              <Link href="/register" className="hover:text-white transition-colors">Register</Link>
              <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
            </nav>
          </div>
          <div className="mt-8 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
            © {new Date().getFullYear()} BloodLink. Made with ❤️ for humanity. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
