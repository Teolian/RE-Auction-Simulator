'use client'

import Link from 'next/link'
import { Auction } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'

const TOKYO_TZ = 'Asia/Tokyo'

interface BuyerDashboardProps {
  auctions: Auction[]
}

export default function BuyerDashboard({ auctions }: BuyerDashboardProps) {
  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, 'yyyy-MM-dd HH:mm') + ' JST'
  }

  // Filter auctions for buyers
  const openAuctions = auctions.filter(a => a.status === 'open')
  const lockedAuctions = auctions.filter(a => a.status === 'locked')
  const clearedAuctions = auctions.filter(a => a.status === 'cleared' || a.status === 'published')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-32 font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-16 text-gray-600 mt-1">Browse auctions and submit sealed bids</p>
        </div>
        <Link
          href="/bids/create"
          className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-16 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Submit Bid
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-5">
          <div className="text-12 text-blue-700 mb-1 uppercase tracking-wide font-semibold">Open for Bids</div>
          <div className="text-32 font-bold text-blue-700">{openAuctions.length}</div>
          <div className="text-12 text-blue-600 mt-1">Submit now</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-5">
          <div className="text-12 text-yellow-700 mb-1 uppercase tracking-wide font-semibold">Pending Clearing</div>
          <div className="text-32 font-bold text-yellow-700">{lockedAuctions.length}</div>
          <div className="text-12 text-yellow-600 mt-1">Awaiting results</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-5">
          <div className="text-12 text-green-700 mb-1 uppercase tracking-wide font-semibold">Completed</div>
          <div className="text-32 font-bold text-green-700">{clearedAuctions.length}</div>
          <div className="text-12 text-green-600 mt-1">View awards</div>
        </div>
      </div>

      {/* Open Auctions - Priority Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-20 font-semibold text-gray-900">Available Auctions</h2>
              <p className="text-14 text-gray-600 mt-0.5">Submit sealed bids before auction closes</p>
            </div>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-14 font-semibold">
              {openAuctions.length} Open
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {openAuctions.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-16 text-gray-500 font-medium mb-2">No open auctions</p>
              <p className="text-14 text-gray-400">Check back later for new bidding opportunities</p>
            </div>
          ) : (
            openAuctions.map((auction) => (
                <div
                  key={auction.auction_id}
                  className="p-5 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <Link
                          href={`/auctions/${auction.auction_id}`}
                          className="text-18 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                        >
                          {auction.area} Auction
                        </Link>
                        <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-12 font-semibold uppercase">
                          OPEN
                        </span>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-12 font-mono">
                          {auction.mode.replace('_', ' ').toUpperCase()}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-14">
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">Auction ID</div>
                          <div className="font-mono text-gray-900">#{auction.auction_id}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">Bidding Opens</div>
                          <div className="text-gray-900">{formatDateTime(auction.starts_at).split(' ')[0]}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">Bidding Closes</div>
                          <div className="text-red-600 font-semibold">{formatDateTime(auction.ends_at).split(' ')[0]}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/auctions/${auction.auction_id}`}
                        className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-14 transition-colors"
                      >
                        View Lots
                      </Link>
                      <Link
                        href="/bids/create"
                        className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold text-14 transition-colors"
                      >
                        Submit Bid
                      </Link>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </div>

      {/* Pending Clearing */}
      {lockedAuctions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100 bg-yellow-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-20 font-semibold text-gray-900">Pending Clearing</h2>
                <p className="text-14 text-gray-600 mt-0.5">Your bids are submitted, waiting for results</p>
              </div>
              <span className="px-3 py-1 bg-yellow-600 text-white rounded-lg text-14 font-semibold">
                {lockedAuctions.length} Auctions
              </span>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {lockedAuctions.map((auction) => (
              <div key={auction.auction_id} className="p-5">
                <div className="flex items-center justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-18 font-semibold text-gray-900">{auction.area} Auction</span>
                      <span className="px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-lg text-12 font-semibold uppercase">
                        LOCKED
                      </span>
                    </div>
                    <div className="text-14 text-gray-600">
                      Auction #{auction.auction_id} • Clearing in progress...
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 text-yellow-600">
                      <svg className="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      <span className="text-14 font-medium">Awaiting Results</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cleared Auctions - Results */}
      {clearedAuctions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-20 font-semibold text-gray-900">Auction Results</h2>
            <p className="text-14 text-gray-600 mt-0.5">View clearing prices and your awards</p>
          </div>

          <div className="divide-y divide-gray-100">
            {clearedAuctions.map((auction) => (
              <div key={auction.auction_id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Link
                        href={`/auctions/${auction.auction_id}`}
                        className="text-18 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {auction.area} Auction
                      </Link>
                      <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-12 font-semibold uppercase">
                        {auction.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-14">
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Auction ID</div>
                        <div className="font-mono text-gray-900">#{auction.auction_id}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Cleared Price</div>
                        <div className="font-semibold text-green-600">
                          {auction.cleared_price ? `¥${auction.cleared_price.toFixed(2)}/kWh` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Total Volume</div>
                        <div className="text-gray-900 font-semibold">
                          {auction.cleared_volume ? `${auction.cleared_volume.toFixed(0)} MWh` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/auctions/${auction.auction_id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-14 transition-colors"
                  >
                    View My Awards
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
