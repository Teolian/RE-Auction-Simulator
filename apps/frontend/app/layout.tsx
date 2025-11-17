import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import ClientProviders from '@/components/ClientProviders'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RE-Auction Simulator',
  description: 'Renewable Energy Auction Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ClientProviders messages={{}} locale="en">
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="max-w-[1400px] mx-auto px-8 py-8">
              {children}
            </main>
          </div>
        </ClientProviders>
      </body>
    </html>
  )
}
