import type { Metadata, Viewport } from 'next'
import './globals.css'
import { AuthProvider } from './lib/auth-context'

export const metadata: Metadata = {
  title: 'HealthCare Pro - Complete Healthcare Management System',
  description: 'AI-powered healthcare management with appointments, health records, and symptom checking',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
