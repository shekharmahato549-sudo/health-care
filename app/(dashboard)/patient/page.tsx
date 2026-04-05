'use client'

import { useAuth } from '@/app/lib/auth-context'
import { ProtectedRoute } from '@/app/components/ProtectedRoute'
import { useEffect, useState } from 'react'
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

export default function PatientDashboard() {
  const { user } = useAuth()
  const { data: appointments } = useSWR('/api/appointments', fetcher)
  const { data: healthRecords } = useSWR('/api/health-records/patient/' + user?.id, fetcher)
  const { data: notifications } = useSWR('/api/notifications/unread', fetcher)

  return (
    <ProtectedRoute requiredRole="patient">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back, {user?.first_name}! 👋
            </h1>
            <p className="text-gray-600 mt-2">Manage your health and appointments</p>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Upcoming Appointments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {appointments?.filter((a: any) => new Date(a.scheduled_date) > new Date()).length || 0}
                  </p>
                </div>
                <div className="text-4xl">📅</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Health Records</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {healthRecords?.length || 0}
                  </p>
                </div>
                <div className="text-4xl">📋</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Notifications</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">
                    {notifications?.length || 0}
                  </p>
                </div>
                <div className="text-4xl">🔔</div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Link href="/dashboard/patient/appointments/book">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">📞</div>
                <h3 className="font-bold text-gray-900">Book Appointment</h3>
                <p className="text-sm text-gray-600 mt-1">Schedule with a doctor</p>
              </div>
            </Link>

            <Link href="/dashboard/patient/symptom-checker">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">🏥</div>
                <h3 className="font-bold text-gray-900">Symptom Checker</h3>
                <p className="text-sm text-gray-600 mt-1">AI-powered analysis</p>
              </div>
            </Link>

            <Link href="/dashboard/patient/health-records">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">📄</div>
                <h3 className="font-bold text-gray-900">Health Records</h3>
                <p className="text-sm text-gray-600 mt-1">View your medical history</p>
              </div>
            </Link>

            <Link href="/dashboard/patient/profile">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">👤</div>
                <h3 className="font-bold text-gray-900">My Profile</h3>
                <p className="text-sm text-gray-600 mt-1">Update your information</p>
              </div>
            </Link>
          </div>

          {/* Upcoming Appointments */}
          <div className="card mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Appointments</h2>
            {appointments && appointments.length > 0 ? (
              <div className="space-y-3">
                {appointments.slice(0, 5).map((apt: any) => (
                  <div key={apt.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{apt.appointment_type}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(apt.scheduled_date).toLocaleDateString()} at {new Date(apt.scheduled_date).toLocaleTimeString()}
                      </p>
                    </div>
                    <span className={`badge badge-${apt.status === 'scheduled' ? 'info' : 'warning'}`}>
                      {apt.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No upcoming appointments. <Link href="/dashboard/patient/appointments/book" className="text-blue-600 hover:underline">Book one now</Link></p>
            )}
          </div>

          {/* Recent Health Records */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Health Records</h2>
            {healthRecords && healthRecords.length > 0 ? (
              <div className="space-y-3">
                {healthRecords.slice(0, 5).map((record: any) => (
                  <div key={record.id} className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{record.title}</p>
                        <p className="text-sm text-gray-600">{record.record_type}</p>
                      </div>
                      <p className="text-sm text-gray-500">
                        {new Date(record.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No health records yet</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
