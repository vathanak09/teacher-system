import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'BSIS International School',
  description: 'A modern platform for teachers and students.',
  manifest: '/manifest.json',
  icons: {
    apple: '/logo.png',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'BSIS',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
