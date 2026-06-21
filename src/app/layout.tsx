import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Outreach 1 MVP',
  description: 'Executive Research & Outreach Ranking Platform',
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
