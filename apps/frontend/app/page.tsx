'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Auction } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'

const TOKYO_TZ = 'Asia/Tokyo'

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

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

  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, 'yyyy-MM-dd HH:mm JST')
  }

  const getStatusColor = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700',
      open: 'bg-green-100 text-green-700',
      locked: 'bg-yellow-100 text-yellow-700',
      cleared: 'bg-blue-100 text-blue-700',
      published: 'bg-purple-100 text-purple-700',
    }
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700'
  }

  if (loading) {
    return <div className="text-center py-8">Loading auctions...</div>
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-32 font-semibold">Auctions</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800 font-medium">Error</p>
          <p className="text-red-600 text-14">{error}</p>
          <button
            onClick={loadAuctions}
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-14"
          >
            Retry
          </button>
        </div>
      )}

      {auctions.length === 0 && !error ? (
        <div className="bg-white rounded-lg border border-gray-200 p-16 text-center">
          <p className="text-gray-500 mb-4">No auctions found</p>
          <p className="text-14 text-gray-400">
            Run the seed script to create sample data
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {auctions.map((auction) => (
            <Link
              key={auction.auction_id}
              href={`/auctions/${auction.auction_id}`}
              className="block"
            >
              <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-18 font-semibold mb-2">
                      {auction.area} - {auction.mode.replace('_', ' ').toUpperCase()}
                    </h3>
                    <div className="text-14 text-gray-600 space-y-1">
                      <div>ID: {auction.auction_id}</div>
                      <div>Start: {formatDateTime(auction.starts_at)}</div>
                      <div>End: {formatDateTime(auction.ends_at)}</div>
                    </div>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-12 font-medium ${getStatusColor(
                      auction.status
                    )}`}
                  >
                    {auction.status.toUpperCase()}
                  </span>
                </div>

                {auction.cleared_price !== null && (
                  <div className="pt-4 border-t border-gray-100">
                    <div className="grid grid-cols-2 gap-4 text-14">
                      <div>
                        <div className="text-gray-500">Cleared Price</div>
                        <div className="font-semibold">
                          ¥{auction.cleared_price.toFixed(2)}/kWh
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500">Cleared Volume</div>
                        <div className="font-semibold">
                          {auction.cleared_volume?.toFixed(1)} MWh
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
