import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'InvoiceGuard — Stop chasing unpaid invoices',
  description: 'Automated payment follow-ups for freelancers who are tired of writing awkward reminder messages.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="bg-paper text-ink antialiased">{children}</body>
    </html>
  )
}
