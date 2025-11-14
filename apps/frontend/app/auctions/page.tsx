'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Auction } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'
import Breadcrumbs from '@/components/Breadcrumbs'

const TOKYO_TZ = 'Asia/Tokyo'

type StatusFilter = 'all' | 'draft' | 'open' | 'locked' | 'cleared' | 'published'

export default function AuctionsList() {
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
    draft: auctions.filter(a => a.status === 'draft').length,
    open: auctions.filter(a => a.status === 'open').length,
    locked: auctions.filter(a => a.status === 'locked').length,
    cleared: auctions.filter(a => a.status === 'cleared' || a.status === 'published').length,
  }

  // Filter auctions
  const filteredAuctions = statusFilter === 'all'
    ? auctions
    : auctions.filter(a => a.status === statusFilter)

  // Sort by creation date (newest first)
  const sortedAuctions = [...filteredAuctions].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600">Loading auctions...</div>
        </div>
      </div>
    )
  }

  return (
    <>
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Auctions' }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-32 font-bold text-gray-900 mb-2">Auctions</h1>
            <p className="text-16 text-gray-600">
              Renewable energy sealed-bid auctions with uniform-price and pay-as-bid clearing
            </p>
          </div>
          <Link
            href="/auctions/create"
            className="px-5 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium transition-colors text-14 flex items-center gap-2 shadow-sm"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Auction
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Total</div>
            <div className="text-28 font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Draft</div>
            <div className="text-28 font-bold text-gray-600">{stats.draft}</div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Open</div>
            <div className="text-28 font-bold text-green-600">{stats.open}</div>
          </div>
          <div className="bg-white rounded-lg border border-yellow-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Locked</div>
            <div className="text-28 font-bold text-yellow-600">{stats.locked}</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Cleared</div>
            <div className="text-28 font-bold text-blue-600">{stats.cleared}</div>
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

      {/* Auctions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-20 font-semibold">All Auctions</h2>

            {/* Status Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'draft', 'open', 'locked', 'cleared', 'published'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-14 font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? `All (${stats.total})` : status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {sortedAuctions.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-gray-500 font-medium mb-2">
                {error ? 'No connection to backend' : 'No auctions found'}
              </p>
              <p className="text-14 text-gray-400 mb-4">
                {error
                  ? 'Please ensure the API server is running'
                  : statusFilter === 'all'
                    ? 'Create your first auction to get started'
                    : `No auctions with status "${statusFilter}"`
                }
              </p>
              {!error && statusFilter === 'all' && (
                <Link
                  href="/auctions/create"
                  className="inline-block px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-14"
                >
                  Create First Auction
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedAuctions.map((auction) => (
                <Link
                  key={auction.auction_id}
                  href={`/auctions/${auction.auction_id}`}
                  className="block group"
                >
                  <div className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 hover:shadow-sm transition-all">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-18 font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
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
                            <div className="text-gray-500 text-12 mb-1">Bidding Period</div>
                            <div className="text-gray-900">
                              {formatDateTime(auction.starts_at).split(' ')[0]} - {formatDateTime(auction.ends_at).split(' ')[0]}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Created</div>
                            <div className="text-gray-900">{formatDateTime(auction.created_at).split(' ')[0]}</div>
                          </div>
                          {auction.cleared_price !== null && (
                            <div>
                              <div className="text-gray-500 text-12 mb-1">Cleared Price</div>
                              <div className="font-semibold text-blue-600">
                                ¥{auction.cleared_price.toFixed(2)}/kWh
                                {auction.cleared_volume && (
                                  <span className="text-gray-500 ml-2 font-normal">
                                    ({auction.cleared_volume.toFixed(0)} MWh)
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      <svg className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
