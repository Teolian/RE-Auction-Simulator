'use client'

import Link from 'next/link'
import { Auction } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'

const TOKYO_TZ = 'Asia/Tokyo'

interface SellerDashboardProps {
  auctions: Auction[]
}

export default function SellerDashboard({ auctions }: SellerDashboardProps) {
  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, 'yyyy-MM-dd HH:mm') + ' JST'
  }

  // Filter open auctions where sellers can add lots
  const openAuctions = auctions.filter(a => a.status === 'open' || a.status === 'draft')
  const clearedAuctions = auctions.filter(a => a.status === 'cleared' || a.status === 'published')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-32 font-bold text-gray-900">Seller Dashboard</h1>
          <p className="text-16 text-gray-600 mt-1">Add lots to open auctions and track your sales</p>
        </div>
        <Link
          href="/lots/create"
          className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-16 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Add New Lot
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide font-semibold">Total Auctions</div>
          <div className="text-32 font-bold text-gray-900">{auctions.length}</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-5">
          <div className="text-12 text-green-700 mb-1 uppercase tracking-wide font-semibold">Open for Lots</div>
          <div className="text-32 font-bold text-green-700">{openAuctions.length}</div>
          <div className="text-12 text-green-600 mt-1">Available now</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-5">
          <div className="text-12 text-blue-700 mb-1 uppercase tracking-wide font-semibold">Completed</div>
          <div className="text-32 font-bold text-blue-700">{clearedAuctions.length}</div>
          <div className="text-12 text-blue-600 mt-1">View results</div>
        </div>
      </div>

      {/* Open Auctions - Priority Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-20 font-semibold text-gray-900">Open Auctions</h2>
              <p className="text-14 text-gray-600 mt-0.5">Add your lots to these auctions before they close</p>
            </div>
            <span className="px-3 py-1 bg-green-600 text-white rounded-lg text-14 font-semibold">
              {openAuctions.length} Available
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {openAuctions.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-16 text-gray-500 font-medium mb-2">No open auctions</p>
              <p className="text-14 text-gray-400">Check back later for new auction opportunities</p>
            </div>
          ) : (
            openAuctions.map((auction) => (
              <div key={auction.auction_id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <Link
                        href={`/auctions/${auction.auction_id}`}
                        className="text-18 font-semibold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {auction.area} Auction
                      </Link>
                      <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-12 font-semibold uppercase">
                        {auction.status}
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
                        <div className="text-gray-500 text-12 mb-0.5">Opens</div>
                        <div className="text-gray-900">{formatDateTime(auction.starts_at).split(' ')[0]}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Closes</div>
                        <div className="text-gray-900 font-semibold">{formatDateTime(auction.ends_at).split(' ')[0]}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/auctions/${auction.auction_id}`}
                      className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-14 transition-colors"
                    >
                      View Details
                    </Link>
                    <Link
                      href="/lots/create"
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-14 transition-colors"
                    >
                      Add Lot
                    </Link>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Cleared Auctions - Results */}
      {clearedAuctions.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-20 font-semibold text-gray-900">Completed Auctions</h2>
            <p className="text-14 text-gray-600 mt-0.5">View clearing results and matches</p>
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
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-12 font-semibold uppercase">
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
                        <div className="font-semibold text-blue-600">
                          {auction.cleared_price ? `¥${auction.cleared_price.toFixed(2)}/kWh` : '—'}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Volume</div>
                        <div className="text-gray-900 font-semibold">
                          {auction.cleared_volume ? `${auction.cleared_volume.toFixed(0)} MWh` : '—'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/auctions/${auction.auction_id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-14 transition-colors"
                  >
                    View Results
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
