'use client'

import { useEffect, useState } from 'react'
import { api, Auction } from '@/lib/api'
import { useRole } from '@/contexts/RoleContext'
import OperatorDashboard from '@/components/dashboards/OperatorDashboard'
import SellerDashboard from '@/components/dashboards/SellerDashboard'
import BuyerDashboard from '@/components/dashboards/BuyerDashboard'

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { role } = useRole()

  useEffect(() => {
    loadAuctions()
  }, [])

  const loadAuctions = async () => {
    try {
      const data = await api.getAuctions()
      setAuctions(data)
      setError(null)
    } catch (error) {
      console.error('Failed to load auctions:', error)
      setError('Failed to connect to API. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <div className="text-16 text-gray-600">Loading platform...</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-8">
          <div className="flex items-start gap-4">
            <svg className="w-8 h-8 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <h2 className="text-20 font-semibold text-red-900 mb-2">Connection Error</h2>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="bg-red-100 rounded p-3 mb-4 text-14 text-red-800 font-mono">
                <p className="font-semibold mb-2">Quick fix:</p>
                <p>1. Ensure the API is running: <code className="bg-red-200 px-1 rounded">make up</code></p>
                <p>2. Check API is accessible at: <code className="bg-red-200 px-1 rounded">http://localhost:8000/healthz</code></p>
              </div>
              <button
                onClick={loadAuctions}
                className="px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Render role-specific dashboard
  if (role === 'operator') {
    return <OperatorDashboard auctions={auctions} onRefresh={loadAuctions} />
  }

  if (role === 'seller') {
    return <SellerDashboard auctions={auctions} />
  }

  if (role === 'buyer') {
    return <BuyerDashboard auctions={auctions} />
  }

  return null
}
