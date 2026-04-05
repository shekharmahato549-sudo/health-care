import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Dashboard - HealthCare Pro',
  description: 'Access your healthcare dashboard',
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
