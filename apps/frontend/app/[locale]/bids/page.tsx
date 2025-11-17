'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Bid, Auction } from '@/lib/api'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function BidsList() {
  const [bids, setBids] = useState<Bid[]>([])
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [bidsData, auctionsData] = await Promise.all([
        api.getBids(),
        api.getAuctions(),
      ])
      setBids(bidsData)
      setAuctions(auctionsData)
      setError(null)
    } catch (error) {
      console.error('Failed to load data:', error)
      setError('Failed to connect to API. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const getAuction = (auctionId: number) => {
    return auctions.find(a => a.auction_id === auctionId)
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-100 text-gray-700 border-gray-200',
      open: 'bg-green-50 text-green-700 border-green-200',
      locked: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      cleared: 'bg-blue-50 text-blue-700 border-blue-200',
      published: 'bg-purple-50 text-purple-700 border-purple-200',
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  // Sort by creation date (newest first)
  const sortedBids = [...bids].sort((a, b) => {
    return b.bid_id - a.bid_id
  })

  // Calculate statistics
  const stats = {
    total: bids.length,
    totalVolume: bids.reduce((sum, bid) => sum + bid.volume_mwh, 0),
    avgPrice: bids.length > 0
      ? bids.reduce((sum, bid) => sum + bid.price_yen_kwh, 0) / bids.length
      : 0,
    partialAllowed: bids.filter(b => b.allow_partial).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600">Loading bids...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Bids' }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-32 font-bold text-gray-900 mb-2">Bids</h1>
            <p className="text-16 text-gray-600">
              Energy purchase bids from buyers in sealed-bid auctions
            </p>
          </div>
          <Link
            href="/bids/create"
            className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-14 flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Submit New Bid
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Total Bids</div>
            <div className="text-28 font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Total Volume</div>
            <div className="text-28 font-bold text-blue-600">
              {stats.totalVolume.toFixed(0)}
              <span className="text-16 ml-1 text-gray-500">MWh</span>
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Avg Price</div>
            <div className="text-28 font-bold text-gray-900">
              {stats.avgPrice > 0 ? `¥${stats.avgPrice.toFixed(2)}` : '—'}
              {stats.avgPrice > 0 && <span className="text-16 ml-1 text-gray-500">/kWh</span>}
            </div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Partial Allowed</div>
            <div className="text-28 font-bold text-green-600">{stats.partialAllowed}</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-1">Connection Error</p>
              <p className="text-red-600 text-14 mb-3">{error}</p>
              <button
                onClick={loadData}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-14 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bids List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-20 font-semibold">All Bids</h2>
        </div>

        <div className="p-6">
          {sortedBids.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <p className="text-gray-500 font-medium mb-2">
                {error ? 'No connection to backend' : 'No bids found'}
              </p>
              <p className="text-14 text-gray-400 mb-4">
                {error
                  ? 'Please ensure the API server is running'
                  : 'Submit your first bid to participate in auctions'
                }
              </p>
              {!error && (
                <Link
                  href="/bids/create"
                  className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-14"
                >
                  Submit First Bid
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedBids.map((bid) => {
                const auction = getAuction(bid.auction_id)

                return (
                  <div
                    key={bid.bid_id}
                    className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-18 font-semibold text-gray-900">
                            Bid #{bid.bid_id}
                          </h3>
                          {auction && (
                            <span className={`px-3 py-1 rounded-lg border text-12 font-medium ${getStatusBadge(auction.status)}`}>
                              {auction.status.toUpperCase()}
                            </span>
                          )}
                          {bid.allow_partial && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-lg text-12 font-medium">
                              Partial Allowed
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-5 gap-6 text-14">
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Auction</div>
                            {auction ? (
                              <Link
                                href={`/auctions/${auction.auction_id}`}
                                className="text-blue-600 hover:text-blue-700 hover:underline font-medium"
                              >
                                {auction.area} #{auction.auction_id}
                              </Link>
                            ) : (
                              <div className="text-gray-400">—</div>
                            )}
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Organization</div>
                            <div className="text-gray-900 font-mono">Org #{bid.org_id}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Price</div>
                            <div className="font-semibold text-blue-600">¥{bid.price_yen_kwh.toFixed(2)}/kWh</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Volume</div>
                            <div className="text-gray-900 font-semibold">{bid.volume_mwh.toFixed(0)} MWh</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Total Value</div>
                            <div className="text-gray-900">
                              ¥{(bid.price_yen_kwh * bid.volume_mwh * 1000).toLocaleString()}
                            </div>
                          </div>
                        </div>

                        {auction && auction.mode && (
                          <div className="mt-3 text-13 text-gray-600">
                            Clearing Mode: {auction.mode.replace('_', ' ').toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Back to Dashboard */}
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-14 text-gray-600 hover:text-blue-600"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </>
  )
}
