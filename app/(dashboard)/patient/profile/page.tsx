'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/app/lib/auth-context'
import { ProtectedRoute } from '@/app/components/ProtectedRoute'
import { supabase } from '@/app/lib/supabase'
import useSWR from 'swr'

const fetcher = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${session?.access_token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function Profile() {
  const { user, signOut } = useAuth()
  const { data: patientData } = useSWR(user?.id ? `/api/patients/${user.id}` : null, fetcher)
  
  const [formData, setFormData] = useState<any>({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone: user?.phone || '',
    date_of_birth: '',
    gender: '',
    blood_type: '',
    emergency_contact: '',
    emergency_contact_phone: '',
    allergies: '',
    chronic_conditions: '',
    medications: '',
    insurance_provider: '',
    insurance_id: ''
  })

  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('personal')

  useEffect(() => {
    if (patientData) {
      setFormData({
        ...formData,
        date_of_birth: patientData.date_of_birth || '',
        gender: patientData.gender || '',
        blood_type: patientData.blood_type || '',
        emergency_contact: patientData.emergency_contact || '',
        emergency_contact_phone: patientData.emergency_contact_phone || '',
        allergies: (patientData.allergies || []).join(', '),
        chronic_conditions: (patientData.chronic_conditions || []).join(', '),
        medications: (patientData.medications || []).join(', '),
        insurance_provider: patientData.insurance_provider || '',
        insurance_id: patientData.insurance_id || ''
      })
    }
  }, [patientData])

  const handleInputChange = (e: any) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      const patientUpdate = {
        date_of_birth: formData.date_of_birth || null,
        gender: formData.gender || null,
        blood_type: formData.blood_type || null,
        emergency_contact: formData.emergency_contact || null,
        emergency_contact_phone: formData.emergency_contact_phone || null,
        allergies: formData.allergies ? formData.allergies.split(',').map(s => s.trim()) : [],
        chronic_conditions: formData.chronic_conditions ? formData.chronic_conditions.split(',').map(s => s.trim()) : [],
        medications: formData.medications ? formData.medications.split(',').map(s => s.trim()) : [],
        insurance_provider: formData.insurance_provider || null,
        insurance_id: formData.insurance_id || null
      }

      const res = await fetch('/api/patients/me', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify(patientUpdate)
      })

      if (!res.ok) throw new Error('Failed to update')
      alert('Profile updated successfully!')
    } catch (error) {
      alert('Failed to update profile')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <ProtectedRoute requiredRole="patient">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600 mt-2">Manage your personal and medical information</p>
          </div>

          <div className="card mb-8">
            {/* Tabs */}
            <div className="flex border-b border-gray-200 mb-6">
              {['personal', 'medical', 'insurance'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-4 py-2 font-medium transition border-b-2 ${
                    activeTab === tab
                      ? 'text-blue-600 border-blue-600'
                      : 'text-gray-600 border-transparent hover:text-gray-900'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="space-y-4 mb-6">
              {activeTab === 'personal' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        value={user?.email}
                        disabled
                        className="input opacity-50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Date of Birth
                      </label>
                      <input
                        type="date"
                        name="date_of_birth"
                        value={formData.date_of_birth}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="input"
                      >
                        <option value="">Select gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'medical' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Blood Type
                      </label>
                      <select
                        name="blood_type"
                        value={formData.blood_type}
                        onChange={handleInputChange}
                        className="input"
                      >
                        <option value="">Select blood type</option>
                        <option value="O+">O+</option>
                        <option value="O-">O-</option>
                        <option value="A+">A+</option>
                        <option value="A-">A-</option>
                        <option value="B+">B+</option>
                        <option value="B-">B-</option>
                        <option value="AB+">AB+</option>
                        <option value="AB-">AB-</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Emergency Contact
                      </label>
                      <input
                        type="text"
                        name="emergency_contact"
                        value={formData.emergency_contact}
                        onChange={handleInputChange}
                        placeholder="Name"
                        className="input"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Phone
                    </label>
                    <input
                      type="tel"
                      name="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={handleInputChange}
                      className="input"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies (comma-separated)
                    </label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={handleInputChange}
                      className="input"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Chronic Conditions (comma-separated)
                    </label>
                    <textarea
                      name="chronic_conditions"
                      value={formData.chronic_conditions}
                      onChange={handleInputChange}
                      className="input"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Medications (comma-separated)
                    </label>
                    <textarea
                      name="medications"
                      value={formData.medications}
                      onChange={handleInputChange}
                      className="input"
                      rows={2}
                    />
                  </div>
                </>
              )}

              {activeTab === 'insurance' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance Provider
                      </label>
                      <input
                        type="text"
                        name="insurance_provider"
                        value={formData.insurance_provider}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Insurance ID
                      </label>
                      <input
                        type="text"
                        name="insurance_id"
                        value={formData.insurance_id}
                        onChange={handleInputChange}
                        className="input"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="btn btn-primary disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={signOut}
                className="btn btn-secondary"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
