'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Auction } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'

const TOKYO_TZ = 'Asia/Tokyo'

type StatusFilter = 'all' | 'open' | 'locked' | 'cleared' | 'draft'

export default function Home() {
  const [auctions, setAuctions] = useState<Auction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

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
    return formatInTimeZone(new Date(date), TOKYO_TZ, 'yyyy-MM-dd HH:mm') + ' JST'
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

  // Calculate statistics
  const stats = {
    total: auctions.length,
    open: auctions.filter(a => a.status === 'open').length,
    locked: auctions.filter(a => a.status === 'locked').length,
    cleared: auctions.filter(a => a.status === 'cleared' || a.status === 'published').length,
    totalVolume: auctions
      .filter(a => a.cleared_volume)
      .reduce((sum, a) => sum + (a.cleared_volume || 0), 0),
    avgPrice: auctions.filter(a => a.cleared_price).length > 0
      ? auctions
          .filter(a => a.cleared_price)
          .reduce((sum, a) => sum + (a.cleared_price || 0), 0) /
        auctions.filter(a => a.cleared_price).length
      : 0,
  }

  // Filter auctions
  const filteredAuctions = statusFilter === 'all'
    ? auctions
    : auctions.filter(a => a.status === statusFilter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600">Loading platform data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-8 mb-8">
        <div className="max-w-3xl">
          <h1 className="text-40 font-bold text-gray-900 mb-3">
            RE Auction Platform
          </h1>
          <p className="text-18 text-gray-700 mb-6">
            Renewable Energy Trading Platform for sealed-bid auctions.
            Trade solar and wind energy with transparent uniform-price and pay-as-bid clearing mechanisms.
          </p>

          {/* Key Metrics */}
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border border-blue-100 p-4">
              <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Active Auctions</div>
              <div className="text-28 font-bold text-primary">{stats.open}</div>
              <div className="text-12 text-gray-600 mt-1">Open for bidding</div>
            </div>
            <div className="bg-white rounded-lg border border-blue-100 p-4">
              <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Volume Cleared</div>
              <div className="text-28 font-bold text-green-600">
                {stats.totalVolume.toFixed(0)}
                <span className="text-16 ml-1 text-gray-500">MWh</span>
              </div>
              <div className="text-12 text-gray-600 mt-1">Total traded</div>
            </div>
            <div className="bg-white rounded-lg border border-blue-100 p-4">
              <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Avg. Price</div>
              <div className="text-28 font-bold text-gray-900">
                {stats.avgPrice > 0 ? `¥${stats.avgPrice.toFixed(2)}` : '—'}
                {stats.avgPrice > 0 && <span className="text-16 ml-1 text-gray-500">/kWh</span>}
              </div>
              <div className="text-12 text-gray-600 mt-1">Clearing price</div>
            </div>
          </div>
        </div>
      </div>

      {/* User Journey Cards */}
      <div className="mb-8">
        <h2 className="text-24 font-semibold mb-4">Platform Workflows</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {/* Operator Pipeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-18 font-semibold">Operator</h3>
                <p className="text-12 text-gray-500">Platform Management</p>
              </div>
            </div>
            <ol className="space-y-2 text-14 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-semibold min-w-[20px]">1.</span>
                <span>Create auction with mode & area</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-semibold min-w-[20px]">2.</span>
                <span>Open bidding window</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-semibold min-w-[20px]">3.</span>
                <span>Lock auction after deadline</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-semibold min-w-[20px]">4.</span>
                <span>Run clearing algorithm</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-semibold min-w-[20px]">5.</span>
                <span>Publish results to participants</span>
              </li>
            </ol>
            <Link href="/auctions/create" className="block w-full mt-6 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors text-14 text-center">
              Create Auction
            </Link>
          </div>

          {/* Seller Pipeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-18 font-semibold">Seller</h3>
                <p className="text-12 text-gray-500">Energy Producer</p>
              </div>
            </div>
            <ol className="space-y-2 text-14 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-semibold min-w-[20px]">1.</span>
                <span>Register power plants (PV/Wind)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-semibold min-w-[20px]">2.</span>
                <span>Browse open auctions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-semibold min-w-[20px]">3.</span>
                <span>Create lots with volume & reserve price</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-semibold min-w-[20px]">4.</span>
                <span>Monitor auction status</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 font-semibold min-w-[20px]">5.</span>
                <span>View clearing results & matches</span>
              </li>
            </ol>
            <Link href="/lots/create" className="block w-full mt-6 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-14 text-center">
              Add Lot
            </Link>
          </div>

          {/* Buyer Pipeline */}
          <div className="bg-white rounded-lg border border-gray-200 p-6 hover:border-primary transition-colors">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-18 font-semibold">Buyer</h3>
                <p className="text-12 text-gray-500">Energy Trader</p>
              </div>
            </div>
            <ol className="space-y-2 text-14 text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold min-w-[20px]">1.</span>
                <span>Browse available auctions</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold min-w-[20px]">2.</span>
                <span>Review lots and supply volumes</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold min-w-[20px]">3.</span>
                <span>Submit sealed bids with price & volume</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold min-w-[20px]">4.</span>
                <span>Wait for auction clearing</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-600 font-semibold min-w-[20px]">5.</span>
                <span>View awarded matches & prices</span>
              </li>
            </ol>
            <Link href="/bids/create" className="block w-full mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-14 text-center">
              Submit Bid
            </Link>
          </div>
        </div>
      </div>

      {/* Post-Clearing Workflow */}
      <div className="mb-8">
        <h2 className="text-24 font-semibold mb-4">Post-Clearing Workflow</h2>
        <div className="bg-gradient-to-r from-indigo-50 to-teal-50 rounded-lg border border-indigo-100 p-6">
          <div className="grid md:grid-cols-4 gap-4">
            {/* Step 1: Clearing */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-14 font-bold text-blue-600">1</span>
                </div>
                <h3 className="text-16 font-semibold">Auction Cleared</h3>
              </div>
              <p className="text-13 text-gray-600">
                Lots and bids matched by clearing algorithm. Participants notified of results.
              </p>
            </div>

            {/* Step 2: Interview */}
            <div className="bg-white rounded-lg border border-indigo-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <span className="text-14 font-bold text-indigo-600">2</span>
                </div>
                <h3 className="text-16 font-semibold">面談 (Interview)</h3>
              </div>
              <p className="text-13 text-gray-600 mb-3">
                Buyer and seller meet to discuss terms, verify plant specs.
              </p>
              <Link
                href="/interviews"
                className="inline-flex items-center gap-1 text-13 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                View Interviews
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Step 3: Contract */}
            <div className="bg-white rounded-lg border border-teal-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-teal-100 rounded-full flex items-center justify-center">
                  <span className="text-14 font-bold text-teal-600">3</span>
                </div>
                <h3 className="text-16 font-semibold">Contract Signing</h3>
              </div>
              <p className="text-13 text-gray-600 mb-3">
                Legal agreement drafted and signed by both parties.
              </p>
              <Link
                href="/contracts"
                className="inline-flex items-center gap-1 text-13 text-teal-600 hover:text-teal-700 font-medium"
              >
                View Contracts
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            {/* Step 4: Delivery */}
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-14 font-bold text-green-600">4</span>
                </div>
                <h3 className="text-16 font-semibold">Delivery</h3>
              </div>
              <p className="text-13 text-gray-600">
                Energy delivered per contract terms. Payment settlement executed.
              </p>
            </div>
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
                onClick={loadAuctions}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-14 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auctions Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-24 font-semibold">Live Auctions</h2>

            {/* Status Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'open', 'locked', 'cleared', 'draft'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-14 font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? `All (${stats.total})` : `${status.charAt(0).toUpperCase() + status.slice(1)}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {filteredAuctions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 font-medium mb-2">
                {error ? 'No connection to backend' : 'No auctions found'}
              </p>
              <p className="text-14 text-gray-400">
                {error
                  ? 'Please ensure the API server is running on port 8000'
                  : statusFilter === 'all'
                    ? 'Run `make seed` to create sample auctions'
                    : `No auctions with status "${statusFilter}"`
                }
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAuctions.map((auction) => (
                <Link
                  key={auction.auction_id}
                  href={`/auctions/${auction.auction_id}`}
                  className="block group"
                >
                  <div className="bg-white rounded-lg border border-gray-200 p-5 hover:border-primary hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-18 font-semibold text-gray-900 group-hover:text-primary transition-colors">
                            {auction.area} Auction
                          </h3>
                          <span className={`px-3 py-1 rounded-lg border text-12 font-medium ${getStatusBadge(auction.status)}`}>
                            {auction.status.toUpperCase()}
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-12 font-mono">
                            {auction.mode.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-4 gap-6 text-14">
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Auction ID</div>
                            <div className="font-mono text-gray-900">#{auction.auction_id}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Start Time</div>
                            <div className="text-gray-900">{formatDateTime(auction.starts_at).split(' ')[0]}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">End Time</div>
                            <div className="text-gray-900">{formatDateTime(auction.ends_at).split(' ')[0]}</div>
                          </div>
                          {auction.cleared_price !== null && (
                            <div>
                              <div className="text-gray-500 text-12 mb-1">Cleared</div>
                              <div className="font-semibold text-primary">
                                ¥{auction.cleared_price.toFixed(2)}/kWh
                                <span className="text-gray-500 ml-2 font-normal">
                                  {auction.cleared_volume?.toFixed(0)} MWh
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <svg className="w-5 h-5 text-gray-400 group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
