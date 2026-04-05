import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'HealthCare Pro - Authentication',
  description: 'Sign in or create your healthcare account',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
