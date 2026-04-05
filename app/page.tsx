'use client'

import { useAuth } from './lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated && user) {
        // Redirect to dashboard based on role
        const dashboardMap: Record<string, string> = {
          patient: '/dashboard/patient',
          doctor: '/dashboard/doctor',
          admin: '/dashboard/admin',
          receptionist: '/dashboard/receptionist',
          nurse: '/dashboard/nurse',
        }
        router.push(dashboardMap[user.role] || '/dashboard/patient')
      } else if (!loading && !isAuthenticated) {
        router.push('/sign-in')
      }
    }
  }, [isAuthenticated, loading, user, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return null
}
