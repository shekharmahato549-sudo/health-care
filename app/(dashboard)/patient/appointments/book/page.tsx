'use client'

import { useState } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import { ProtectedRoute } from '@/app/components/ProtectedRoute'
import { supabase } from '@/app/lib/supabase'
import useSWR from 'swr'
import { useRouter } from 'next/navigation'

const fetcher = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${session?.access_token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function BookAppointment() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: doctors } = useSWR('/api/doctors', fetcher)
  
  const [selectedDoctor, setSelectedDoctor] = useState('')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedTime, setSelectedTime] = useState('')
  const [appointmentType, setAppointmentType] = useState('consultation')
  const [reason, setReason] = useState('')
  const [loading, setLoading] = useState(false)

  const timeSlots = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30'
  ]

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime) {
      alert('Please select doctor, date, and time')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const scheduledDateTime = `${selectedDate}T${selectedTime}:00`

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({
          doctor_id: selectedDoctor,
          scheduled_date: scheduledDateTime,
          appointment_type: appointmentType,
          reason: reason || undefined,
          duration_minutes: 30
        })
      })

      if (!res.ok) throw new Error('Booking failed')
      
      alert('Appointment booked successfully!')
      router.push('/dashboard/patient')
    } catch (error) {
      alert('Failed to book appointment. Please try again.')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const getTomorrowDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 1)
    return date.toISOString().split('T')[0]
  }

  const getMaxDate = () => {
    const date = new Date()
    date.setDate(date.getDate() + 30)
    return date.toISOString().split('T')[0]
  }

  return (
    <ProtectedRoute requiredRole="patient">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Book an Appointment</h1>
            <p className="text-gray-600 mt-2">Schedule a consultation with a healthcare provider</p>
          </div>

          <div className="card">
            <div className="space-y-6">
              {/* Step 1: Select Doctor */}
              <div>
                <h2 className="text-xl font-bold text-gray-900 mb-4">Step 1: Select a Doctor</h2>
                
                {doctors && doctors.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {doctors.map((doctor: any) => (
                      <button
                        key={doctor.id}
                        onClick={() => setSelectedDoctor(doctor.id)}
                        className={`p-4 rounded-lg border-2 transition text-left ${
                          selectedDoctor === doctor.id
                            ? 'border-blue-600 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <p className="font-bold text-gray-900">Dr. {doctor.id.substring(0, 8)}</p>
                        <p className="text-sm text-gray-600">{doctor.specialization}</p>
                        {doctor.consultation_fee && (
                          <p className="text-sm font-medium text-blue-600 mt-2">
                            ${doctor.consultation_fee}
                          </p>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-600">No doctors available</p>
                )}
              </div>

              {selectedDoctor && (
                <>
                  {/* Step 2: Select Type */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Step 2: Appointment Type</h2>
                    <select
                      value={appointmentType}
                      onChange={(e) => setAppointmentType(e.target.value)}
                      className="input max-w-md"
                    >
                      <option value="consultation">Consultation</option>
                      <option value="checkup">Checkup</option>
                      <option value="follow_up">Follow-up</option>
                      <option value="procedure">Procedure</option>
                    </select>
                  </div>

                  {/* Step 3: Select Date & Time */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Step 3: Date & Time</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Date
                        </label>
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          min={getTomorrowDate()}
                          max={getMaxDate()}
                          className="input"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Time
                        </label>
                        <select
                          value={selectedTime}
                          onChange={(e) => setSelectedTime(e.target.value)}
                          disabled={!selectedDate}
                          className="input disabled:opacity-50"
                        >
                          <option value="">Choose time slot</option>
                          {timeSlots.map(time => (
                            <option key={time} value={time}>
                              {time}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Step 4: Reason (Optional) */}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Step 4: Reason (Optional)</h2>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="input"
                      rows={4}
                      placeholder="Describe why you're visiting..."
                    />
                  </div>

                  {/* Review */}
                  {selectedDate && selectedTime && (
                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <h3 className="font-bold text-gray-900 mb-2">Appointment Summary</h3>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>📅 <strong>Date:</strong> {new Date(selectedDate).toLocaleDateString()}</li>
                        <li>🕐 <strong>Time:</strong> {selectedTime}</li>
                        <li>👨‍⚕️ <strong>Type:</strong> {appointmentType}</li>
                      </ul>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={handleBook}
                    disabled={loading || !selectedDate || !selectedTime}
                    className="w-full btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-3"
                  >
                    {loading ? 'Booking...' : 'Confirm Booking'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
