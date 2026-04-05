'use client'

import { useAuth } from '@/app/lib/auth-context'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: string | string[]
}

export function ProtectedRoute({ children, requiredRole }: ProtectedRouteProps) {
  const { user, loading, isAuthenticated, hasRole } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/sign-in')
    }

    if (!loading && isAuthenticated && requiredRole && !hasRole(requiredRole as any)) {
      router.push('/unauthorized')
    }
  }, [loading, isAuthenticated, requiredRole, hasRole, router])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return null
  }

  if (requiredRole && !hasRole(requiredRole as any)) {
    return null
  }

  return <>{children}</>
}
