'use client'

import Link from 'next/link'
import { useAuth } from '@/app/lib/auth-context'

export default function Unauthorized() {
  const { signOut } = useAuth()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🔒</div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Access Denied</h1>
        <p className="text-gray-600 mb-6">
          You don&apos;t have permission to access this resource.
        </p>
        
        <div className="flex gap-4 justify-center">
          <Link href="/dashboard/patient">
            <button className="btn btn-primary">
              Go to Dashboard
            </button>
          </Link>
          <button
            onClick={signOut}
            className="btn btn-secondary"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
