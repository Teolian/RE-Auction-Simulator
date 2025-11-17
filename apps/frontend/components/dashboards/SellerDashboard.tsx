'use client'

import Link from 'next/link'
import { useOrg } from '@/contexts/OrgContext'
import { useAuctionsWithCounts, useMyLots } from '@/lib/hooks'
import MarketOverview from '@/components/MarketOverview'
import { formatInTimeZone } from 'date-fns-tz'

const TOKYO_TZ = 'Asia/Tokyo'

export default function SellerDashboard() {
  const { org } = useOrg()
  const { data: openAuctions, loading: auctionsLoading } = useAuctionsWithCounts({ status: 'open' })
  const { data: myActiveLots, loading: lotsLoading } = useMyLots(org?.org_id || null, 'active')
  const { data: myClearedLots, loading: clearedLoading } = useMyLots(org?.org_id || null, 'cleared')

  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, 'yyyy-MM-dd HH:mm') + ' JST'
  }

  if (!org) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="text-16 text-gray-500 mb-2">Please select an organization</div>
          <div className="text-14 text-gray-400">Use the organization selector in the top navigation</div>
        </div>
      </div>
    )
  }

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

      {/* Market Overview */}
      <MarketOverview />

      {/* Open Auctions - Where I can sell NOW */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-20 font-semibold text-gray-900">Open Auctions</h2>
              <p className="text-14 text-gray-600 mt-0.5">Add your lots to these auctions before they close</p>
            </div>
            <span className="px-3 py-1 bg-green-600 text-white rounded-lg text-14 font-semibold">
              {openAuctions?.length || 0} Available
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {auctionsLoading ? (
            <div className="p-12 text-center">
              <div className="text-14 text-gray-500">Loading auctions...</div>
            </div>
          ) : openAuctions && openAuctions.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-16 text-gray-500 font-medium mb-2">No open auctions</p>
              <p className="text-14 text-gray-400">Check back later for new auction opportunities</p>
            </div>
          ) : (
            openAuctions?.map((auction: any) => (
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

                    <div className="grid grid-cols-4 gap-4 text-14">
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Auction ID</div>
                        <div className="font-mono text-gray-900">#{auction.auction_id}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Current Lots</div>
                        <div className="text-gray-900 font-semibold">{auction.lots_count || 0} lots</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Closes</div>
                        <div className="text-gray-900">{formatDateTime(auction.ends_at).split(' ')[0]}</div>
                      </div>
                      {auction.min_lot_price && auction.max_lot_price && (
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">Price Range</div>
                          <div className="text-gray-900 text-13">
                            ¥{auction.min_lot_price.toFixed(1)}-{auction.max_lot_price.toFixed(1)}/kWh
                          </div>
                        </div>
                      )}
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
                      className="px-5 py-2.5 bg-green-600 text-white hover:bg-green-700 rounded-lg font-semibold text-14 transition-colors"
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

      {/* My Active Lots - Tracking */}
      {myActiveLots && myActiveLots.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-20 font-semibold text-gray-900">My Active Lots</h2>
            <p className="text-14 text-gray-600 mt-0.5">Track your lots in ongoing auctions</p>
          </div>

          <div className="divide-y divide-gray-100">
            {myActiveLots.map((lot: any) => (
              <div key={lot.lot_id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-13 text-gray-500">Lot #{lot.lot_id}</span>
                      <Link
                        href={`/auctions/${lot.auction_id}`}
                        className="text-16 font-semibold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {lot.auction_area} Auction
                      </Link>
                      <span className={`px-2 py-1 rounded text-12 font-semibold uppercase ${
                        lot.auction_status === 'open' ? 'bg-green-50 text-green-700 border border-green-200' :
                        lot.auction_status === 'locked' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {lot.auction_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-14">
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Volume Range</div>
                        <div className="text-gray-900 font-mono">{lot.min_vol_mwh}-{lot.max_vol_mwh} MWh</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Reserve Price</div>
                        <div className="text-gray-900 font-semibold">¥{lot.reserve_price.toFixed(2)}/kWh</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Status</div>
                        <div className="text-gray-900">
                          {lot.auction_status === 'open' ? 'Accepting bids' :
                           lot.auction_status === 'locked' ? 'Pending clearing' :
                           'Processing'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/auctions/${lot.auction_id}`}
                    className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg font-medium text-14 transition-colors"
                  >
                    View Auction
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Results - What I sold */}
      {myClearedLots && myClearedLots.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-20 font-semibold text-gray-900">Recent Results</h2>
            <p className="text-14 text-gray-600 mt-0.5">Your successful sales from cleared auctions</p>
          </div>

          <div className="divide-y divide-gray-100">
            {myClearedLots.map((lot: any) => (
              <div key={lot.lot_id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-13 text-gray-500">Lot #{lot.lot_id}</span>
                      <Link
                        href={`/auctions/${lot.auction_id}`}
                        className="text-16 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {lot.auction_area} Auction
                      </Link>
                      <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-12 font-semibold uppercase">
                        {lot.auction_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-14">
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Offered</div>
                        <div className="text-gray-900">{lot.min_vol_mwh}-{lot.max_vol_mwh} MWh</div>
                      </div>
                      {lot.matched_volume !== null && (
                        <>
                          <div>
                            <div className="text-gray-500 text-12 mb-0.5">Sold Volume</div>
                            <div className="text-green-600 font-semibold">{lot.matched_volume.toFixed(0)} MWh</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-0.5">Cleared Price</div>
                            <div className="text-green-600 font-semibold">¥{lot.cleared_price?.toFixed(2)}/kWh</div>
                          </div>
                        </>
                      )}
                      {lot.matched_volume === null && (
                        <div className="col-span-2">
                          <div className="text-gray-500 text-12 mb-0.5">Result</div>
                          <div className="text-gray-400">No match</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/auctions/${lot.auction_id}`}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium text-14 transition-colors"
                  >
                    View Report
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
