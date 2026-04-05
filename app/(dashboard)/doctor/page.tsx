'use client'

import { useAuth } from '@/app/lib/auth-context'
import { ProtectedRoute } from '@/app/components/ProtectedRoute'
import useSWR from 'swr'
import Link from 'next/link'
import { supabase } from '@/app/lib/supabase'

const fetcher = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`
    }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function DoctorDashboard() {
  const { user } = useAuth()
  const { data: appointments } = useSWR('/api/appointments', fetcher)
  const { data: patients } = useSWR('/api/patients', fetcher)

  const todayAppointments = appointments?.filter((a: any) => {
    const apt_date = new Date(a.scheduled_date).toDateString()
    const today = new Date().toDateString()
    return apt_date === today
  }) || []

  return (
    <ProtectedRoute requiredRole="doctor">
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Dr. {user?.last_name} 👨‍⚕️
            </h1>
            <p className="text-gray-600 mt-2">Manage your patients and appointments</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Today's Appointments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{todayAppointments.length}</p>
                </div>
                <div className="text-4xl">📅</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">My Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{patients?.length || 0}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Pending Records</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">0</p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link href="/dashboard/doctor/patients">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="font-bold text-gray-900">My Patients</h3>
                <p className="text-sm text-gray-600 mt-1">View and manage patient list</p>
              </div>
            </Link>

            <Link href="/dashboard/doctor/availability">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">⏰</div>
                <h3 className="font-bold text-gray-900">Set Availability</h3>
                <p className="text-sm text-gray-600 mt-1">Update your schedule</p>
              </div>
            </Link>
          </div>

          {/* Today's Schedule */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Today's Schedule</h2>
            {todayAppointments.length > 0 ? (
              <div className="space-y-3">
                {todayAppointments.map((apt: any) => (
                  <div key={apt.id} className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{apt.appointment_type}</p>
                        <p className="text-sm text-gray-600">{new Date(apt.scheduled_date).toLocaleTimeString()}</p>
                        {apt.reason && <p className="text-sm text-gray-700 mt-1">Reason: {apt.reason}</p>}
                      </div>
                      <span className={`badge badge-${apt.status === 'scheduled' ? 'info' : 'success'}`}>
                        {apt.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No appointments scheduled for today</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
