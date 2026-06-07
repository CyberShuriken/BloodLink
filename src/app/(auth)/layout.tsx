import Link from 'next/link'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 flex flex-col">
      {/* Header */}
      <header className="p-6">
        <Link href="/" className="inline-flex items-center gap-2">
          <svg viewBox="0 0 24 24" className="h-7 w-7 fill-blood" aria-hidden="true">
            <path d="M12 2C12 2 4 9 4 14a8 8 0 0016 0C20 9 12 2 12 2z" />
          </svg>
          <span className="font-display font-bold text-xl text-blood">BloodLink</span>
        </Link>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">{children}</div>
      </main>

      <footer className="p-6 text-center text-xs text-muted-foreground">
        © {new Date().getFullYear()} BloodLink. Every drop counts.
      </footer>
    </div>
  )
}
