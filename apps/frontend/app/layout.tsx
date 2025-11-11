import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'

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
        <div className="min-h-screen bg-gray-50">
          <header className="bg-white border-b border-gray-200">
            <div className="container mx-auto px-8 py-4">
              <h1 className="text-24 font-semibold text-gray-900">
                RE-Auction Simulator
              </h1>
            </div>
          </header>
          <main className="container mx-auto px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
