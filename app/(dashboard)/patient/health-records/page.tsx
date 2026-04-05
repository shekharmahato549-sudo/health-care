'use client'

import { useAuth } from '@/app/lib/auth-context'
import { ProtectedRoute } from '@/app/components/ProtectedRoute'
import { supabase } from '@/app/lib/supabase'
import useSWR from 'swr'
import { useState } from 'react'

const recordTypes = ['consultation', 'lab', 'imaging', 'prescription', 'diagnosis', 'vital_signs']

const fetcher = async (url: string) => {
  const { data: { session } } = await supabase.auth.getSession()
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${session?.access_token}` }
  })
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default function HealthRecords() {
  const { user } = useAuth()
  const [filterType, setFilterType] = useState('')
  const { data: records } = useSWR(user?.id ? `/api/health-records/patient/${user.id}` : null, fetcher)

  const filteredRecords = records?.filter((r: any) => !filterType || r.record_type === filterType)

  const getRecordIcon = (type: string) => {
    const icons: Record<string, string> = {
      consultation: '💬',
      lab: '🧪',
      imaging: '🖼️',
      prescription: '💊',
      diagnosis: '📋',
      vital_signs: '❤️'
    }
    return icons[type] || '📄'
  }

  return (
    <ProtectedRoute requiredRole="patient">
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Health Records</h1>
            <p className="text-gray-600 mt-2">All your medical documents and information</p>
          </div>

          {/* Filter */}
          <div className="card mb-8">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="input"
                >
                  <option value="">All Types</option>
                  {recordTypes.map(type => (
                    <option key={type} value={type}>
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="text-right pt-6">
                <p className="text-sm font-medium text-gray-600">
                  Total Records: <span className="text-lg font-bold text-gray-900">{filteredRecords?.length || 0}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Records */}
          {filteredRecords && filteredRecords.length > 0 ? (
            <div className="space-y-4">
              {filteredRecords.map((record: any) => (
                <div key={record.id} className="card hover:shadow-md transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-3xl">{getRecordIcon(record.record_type)}</span>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">{record.title}</h3>
                          <p className="text-sm text-gray-600">
                            {record.record_type.charAt(0).toUpperCase() + record.record_type.slice(1)}
                          </p>
                        </div>
                      </div>
                      {record.description && (
                        <p className="text-gray-700 mt-2">{record.description}</p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span>📅 {new Date(record.created_at).toLocaleDateString()}</span>
                        {record.document_url && (
                          <a
                            href={record.document_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                          >
                            📎 View Document
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="badge badge-info">{record.record_type}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card text-center py-12">
              <p className="text-xl text-gray-600">No health records found</p>
              <p className="text-gray-500 mt-2">Your health records will appear here when your doctors add them</p>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  )
}
