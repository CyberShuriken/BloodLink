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
