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

export default function AdminDashboard() {
  const { user } = useAuth()
  const { data: users } = useSWR('/api/users', fetcher)
  const { data: appointments } = useSWR('/api/appointments', fetcher)

  const userStats = {
    total: users?.length || 0,
    patients: users?.filter((u: any) => u.role === 'patient').length || 0,
    doctors: users?.filter((u: any) => u.role === 'doctor').length || 0,
    staff: users?.filter((u: any) => u.role === 'nurse' || u.role === 'receptionist').length || 0,
  }

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-100 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900">Admin Dashboard</h1>
            <p className="text-gray-600 mt-2">System overview and management</p>
          </div>

          {/* System Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Total Users</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{userStats.total}</p>
                </div>
                <div className="text-4xl">👥</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Patients</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{userStats.patients}</p>
                </div>
                <div className="text-4xl">🏥</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Doctors</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{userStats.doctors}</p>
                </div>
                <div className="text-4xl">👨‍⚕️</div>
              </div>
            </div>

            <div className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">Appointments</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{appointments?.length || 0}</p>
                </div>
                <div className="text-4xl">📅</div>
              </div>
            </div>
          </div>

          {/* Admin Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <Link href="/dashboard/admin/users">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">👥</div>
                <h3 className="font-bold text-gray-900">User Management</h3>
                <p className="text-sm text-gray-600 mt-1">Manage all users and roles</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/analytics">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">📊</div>
                <h3 className="font-bold text-gray-900">Analytics</h3>
                <p className="text-sm text-gray-600 mt-1">View system analytics</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/clinics">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">🏢</div>
                <h3 className="font-bold text-gray-900">Clinics</h3>
                <p className="text-sm text-gray-600 mt-1">Manage clinic locations</p>
              </div>
            </Link>

            <Link href="/dashboard/admin/settings">
              <div className="card hover:shadow-lg transition cursor-pointer">
                <div className="text-3xl mb-3">⚙️</div>
                <h3 className="font-bold text-gray-900">Settings</h3>
                <p className="text-sm text-gray-600 mt-1">System configuration</p>
              </div>
            </Link>
          </div>

          {/* Recent Users */}
          <div className="card">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Recent Users</h2>
            {users && users.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Name</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Email</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Role</th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.slice(0, 10).map((u: any) => (
                      <tr key={u.id} className="border-t border-gray-200 hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm">{u.first_name} {u.last_name}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{u.email}</td>
                        <td className="px-4 py-3 text-sm">
                          <span className="badge badge-info">{u.role}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                            {u.is_active ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-gray-600">No users found</p>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  )
}
