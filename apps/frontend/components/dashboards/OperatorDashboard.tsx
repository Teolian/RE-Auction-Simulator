'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Auction } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'

const TOKYO_TZ = 'Asia/Tokyo'

interface OperatorDashboardProps {
  auctions: Auction[]
  onRefresh: () => void
}

export default function OperatorDashboard({ auctions, onRefresh }: OperatorDashboardProps) {
  const [processingAuction, setProcessingAuction] = useState<number | null>(null)

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

  // Statistics
  const stats = {
    total: auctions.length,
    open: auctions.filter(a => a.status === 'open').length,
    locked: auctions.filter(a => a.status === 'locked').length,
    cleared: auctions.filter(a => a.status === 'cleared' || a.status === 'published').length,
  }

  const handleLockAuction = async (auctionId: number) => {
    setProcessingAuction(auctionId)
    try {
      const response = await fetch(`http://localhost:8000/api/auctions/${auctionId}/lock`, {
        method: 'POST',
      })
      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to lock auction:', error)
    } finally {
      setProcessingAuction(null)
    }
  }

  const handleRunClearing = async (auctionId: number) => {
    setProcessingAuction(auctionId)
    try {
      const response = await fetch(`http://localhost:8000/api/auctions/${auctionId}/clear`, {
        method: 'POST',
      })
      if (response.ok) {
        onRefresh()
      }
    } catch (error) {
      console.error('Failed to run clearing:', error)
    } finally {
      setProcessingAuction(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-32 font-bold text-gray-900">Auction Operations</h1>
          <p className="text-16 text-gray-600 mt-1">Manage platform auctions and run clearing</p>
        </div>
        <Link
          href="/auctions/create"
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-16 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Create New Auction
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide font-semibold">Total Auctions</div>
          <div className="text-32 font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-5">
          <div className="text-12 text-green-700 mb-1 uppercase tracking-wide font-semibold">Open</div>
          <div className="text-32 font-bold text-green-700">{stats.open}</div>
          <div className="text-12 text-green-600 mt-1">Accepting bids</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-5">
          <div className="text-12 text-yellow-700 mb-1 uppercase tracking-wide font-semibold">Locked</div>
          <div className="text-32 font-bold text-yellow-700">{stats.locked}</div>
          <div className="text-12 text-yellow-600 mt-1">Ready for clearing</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-5">
          <div className="text-12 text-blue-700 mb-1 uppercase tracking-wide font-semibold">Cleared</div>
          <div className="text-32 font-bold text-blue-700">{stats.cleared}</div>
          <div className="text-12 text-blue-600 mt-1">Results published</div>
        </div>
      </div>

      {/* Auctions List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-20 font-semibold text-gray-900">Active Auctions</h2>
        </div>

        <div className="divide-y divide-gray-100">
          {auctions.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-16 text-gray-500 font-medium mb-2">No auctions found</p>
              <p className="text-14 text-gray-400 mb-4">Create your first auction to get started</p>
              <Link
                href="/auctions/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-14 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Auction
              </Link>
            </div>
          ) : (
            auctions.map((auction, index) => {
              // Highlight first locked auction (ready for clearing demo)
              const isFirstLocked = auction.status === 'locked' &&
                auctions.findIndex(a => a.status === 'locked') === index
              // Highlight first open auction if no locked auctions
              const isFirstOpen = auction.status === 'open' &&
                !auctions.some(a => a.status === 'locked') &&
                auctions.findIndex(a => a.status === 'open') === index
              const isHighlighted = isFirstLocked || isFirstOpen

              return (
                <div
                  key={auction.auction_id}
                  className={`p-5 transition-all ${
                    isFirstLocked
                      ? 'bg-purple-50/50 border-l-4 border-l-purple-500 hover:bg-purple-50'
                      : isFirstOpen
                      ? 'bg-yellow-50/50 border-l-4 border-l-yellow-500 hover:bg-yellow-50'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  {/* Demo hint badges */}
                  {isFirstLocked && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-600 text-white rounded-full text-12 font-bold animate-pulse">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                        </svg>
                        DEMO: Grand Finale
                      </span>
                      <span className="text-13 text-purple-700 font-medium">🎯 Run the clearing engine to match bids</span>
                    </div>
                  )}
                  {isFirstOpen && (
                    <div className="flex items-center gap-2 mb-3">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-yellow-600 text-white rounded-full text-12 font-bold">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                        </svg>
                        Step 1
                      </span>
                      <span className="text-13 text-yellow-700 font-medium">Lock auction when bids are ready</span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-6">
                    {/* Left: Auction Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-3">
                        <Link
                          href={`/auctions/${auction.auction_id}`}
                          className="text-18 font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          {auction.area} Auction
                        </Link>
                        <span className={`px-3 py-1 rounded-lg border text-12 font-semibold uppercase ${getStatusBadge(auction.status)}`}>
                          {auction.status}
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-12 font-mono">
                          {auction.mode.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-4 gap-4 text-14">
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">Auction ID</div>
                          <div className="font-mono text-gray-900">#{auction.auction_id}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">Start</div>
                          <div className="text-gray-900">{formatDateTime(auction.starts_at).split(' ')[0]}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">End</div>
                          <div className="text-gray-900">{formatDateTime(auction.ends_at).split(' ')[0]}</div>
                        </div>
                        {auction.cleared_price !== null && (
                          <div>
                            <div className="text-gray-500 text-12 mb-0.5">Cleared</div>
                            <div className="font-semibold text-purple-600">
                              ¥{auction.cleared_price.toFixed(2)}/kWh
                              <span className="text-gray-500 ml-2 font-normal text-13">
                                {auction.cleared_volume?.toFixed(0)} MWh
                              </span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/auctions/${auction.auction_id}`}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-14 transition-colors"
                      >
                        View Details
                      </Link>

                      {auction.status === 'open' && (
                        <button
                          onClick={() => handleLockAuction(auction.auction_id)}
                          disabled={processingAuction === auction.auction_id}
                          className={`px-5 py-2.5 rounded-lg font-semibold text-14 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isFirstOpen
                              ? 'bg-yellow-600 text-white hover:bg-yellow-700 shadow-lg shadow-yellow-600/30 scale-105'
                              : 'bg-yellow-600 text-white hover:bg-yellow-700'
                          }`}
                        >
                          {processingAuction === auction.auction_id ? 'Locking...' : isFirstOpen ? '🔒 Lock Now' : 'Lock Auction'}
                        </button>
                      )}

                      {auction.status === 'locked' && (
                        <button
                          onClick={() => handleRunClearing(auction.auction_id)}
                          disabled={processingAuction === auction.auction_id}
                          className={`px-5 py-2.5 rounded-lg font-bold text-14 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isFirstLocked
                              ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-lg shadow-purple-600/40 scale-110'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {processingAuction === auction.auction_id ? 'Running...' : isFirstLocked ? '⚡ Run Clearing' : 'Run Clearing'}
                        </button>
                      )}

                      {(auction.status === 'cleared' || auction.status === 'published') && (
                        <Link
                          href={`/auctions/${auction.auction_id}`}
                          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-14 transition-colors"
                        >
                          View Report
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
