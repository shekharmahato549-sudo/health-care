'use client'

import { useAuth } from '@/app/lib/auth-context'
import { ProtectedRoute } from '@/app/components/ProtectedRoute'
import { supabase } from '@/app/lib/supabase'
import useSWR from 'swr'
import Link from 'next/link'
import { useState } from 'react'

const fetcher = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${session?.access_token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function Appointments() {
  const { user } = useAuth()
  const { data: appointments } = useSWR('/api/appointments', fetcher)
  const [filter, setFilter] = useState('all')

  const filteredAppointments = appointments?.filter((apt: any) => {
    const apt_date = new Date(apt.scheduled_date)
    const today = new Date()
    
    if (filter === 'upcoming') return apt_date > today
    if (filter === 'past') return apt_date <= today
    return true
  })

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'scheduled': return 'badge-info'
      case 'completed': return 'badge-success'
      case 'cancelled': return 'badge-danger'
      default: return 'badge-warning'
    }
  }

  const handleCancel = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const res = await fetch(`/api/appointments/${appointmentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          status: 'cancelled',
          cancellation_reason: 'Cancelled by patient'
        })
      })

      if (!res.ok) throw new Error('Failed to cancel')
      alert('Appointment cancelled')
      window.location.reload()
    } catch (error) {
      alert('Failed to cancel appointment')
    }
  }

  return (
    <ProtectedRoute requiredRole="patient">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold text-gray-900">My Appointments</h1>
              <p className="text-gray-600 mt-2">Manage all your scheduled appointments</p>
            </div>
            <Link href="/dashboard/patient/appointments/book">
              <button className="btn btn-primary">
                + Book New Appointment
              </button>
            </Link>
          </div>

          {/* Filter */}
          <div className="card mb-8">
            <div className="flex gap-4">
              {['all', 'upcoming', 'past'].map(f => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === f
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                  }`}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Appointments List */}
          {filteredAppointments && filteredAppointments.length > 0 ? (
            <div className="space-y-4">
              {filteredAppointments.map((apt: any) => (
                <div key={apt.id} className="card hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">📅</span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {apt.appointment_type.charAt(0).toUpperCase() + apt.appointment_type.slice(1)}
                          </h3>
                          <p className="text-sm text-gray-600">
                            {new Date(apt.scheduled_date).toLocaleDateString()} at{' '}
                            {new Date(apt.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      
                      {apt.reason && (
                        <p className="text-gray-700 mb-2">
                          <strong>Reason:</strong> {apt.reason}
                        </p>
                      )}

                      {apt.notes && (
                        <p className="text-sm text-gray-600 mb-3">
                          <strong>Notes:</strong> {apt.notes}
                        </p>
                      )}

                      <div className="flex items-center gap-2">
                        <span className={`badge ${getStatusBadgeColor(apt.status)}`}>
                          {apt.status}
                        </span>
                        <span className="text-sm text-gray-500">Duration: {apt.duration_minutes} min</span>
                      </div>
                    </div>

                    {apt.status === 'scheduled' && new Date(apt.scheduled_date) > new Date() && (
                      <button
                        onClick={() => handleCancel(apt.id)}
                        className="btn btn-danger"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-xl text-gray-600">No appointments found</p>
              <p className="text-gray-500 mt-2">
                {filter === 'all' ? 'You haven\'t booked any appointments yet.' : `You have no ${filter} appointments.`}
              </p>
              {filter === 'all' && (
                <Link href="/dashboard/patient/appointments/book">
                  <button className="btn btn-primary mt-4">
                    Book Your First Appointment
                  </button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
