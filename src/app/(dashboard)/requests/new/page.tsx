import { RequestForm } from '@/components/requests/RequestForm'

export default function NewRequestPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-rose-50 py-10 px-4">
      <div className="max-w-2xl mx-auto mb-8 text-center">
        <h1 className="font-display text-3xl font-bold text-slate-900">Post a Blood Request</h1>
        <p className="text-slate-600 mt-2">
          Fill in the details to notify eligible donors near the hospital.
        </p>
      </div>
      <RequestForm />
    </div>
  )
}
