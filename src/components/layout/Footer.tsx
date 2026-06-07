import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-slate-900 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" className="h-6 w-6 fill-blood" aria-hidden="true">
              <path d="M12 2C12 2 4 9 4 14a8 8 0 0016 0C20 9 12 2 12 2z" />
            </svg>
            <span className="font-display font-bold text-white text-lg">BloodLink</span>
          </div>

          <nav className="flex flex-wrap items-center gap-6 text-sm text-slate-400">
            <Link href="/donors" className="hover:text-white transition-colors">Find Donors</Link>
            <Link href="/requests" className="hover:text-white transition-colors">Requests</Link>
            <Link href="/register" className="hover:text-white transition-colors">Register</Link>
            <Link href="/login" className="hover:text-white transition-colors">Sign In</Link>
          </nav>
        </div>
        <div className="mt-8 border-t border-slate-800 pt-8 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} BloodLink. Connecting donors, hospitals, and blood banks for every emergency.
        </div>
      </div>
    </footer>
  )
}
