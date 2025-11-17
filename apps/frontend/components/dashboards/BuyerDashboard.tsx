'use client'

import Link from 'next/link'
import { useOrg } from '@/contexts/OrgContext'
import { useAuctionsWithCounts, useMyBids } from '@/lib/hooks'
import MarketOverview from '@/components/MarketOverview'
import { formatInTimeZone } from 'date-fns-tz'

const TOKYO_TZ = 'Asia/Tokyo'

export default function BuyerDashboard() {
  const { org } = useOrg()
  const { data: openAuctions, loading: auctionsLoading } = useAuctionsWithCounts({ status: 'open' })
  const { data: myActiveBids, loading: bidsLoading } = useMyBids(org?.org_id || null, 'active')
  const { data: myClearedBids, loading: clearedLoading } = useMyBids(org?.org_id || null, 'cleared')

  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, 'yyyy-MM-dd HH:mm') + ' JST'
  }

  // Filter auctions with lots (buyers only care about auctions that have something to buy)
  const auctionsWithLots = openAuctions?.filter((a: any) => a.lots_count > 0) || []

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

      {/* Market Overview */}
      <MarketOverview />

      {/* Available Lots - What I can buy NOW */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-20 font-semibold text-gray-900">Available Lots</h2>
              <p className="text-14 text-gray-600 mt-0.5">Submit sealed bids before auction closes</p>
            </div>
            <span className="px-3 py-1 bg-blue-600 text-white rounded-lg text-14 font-semibold">
              {auctionsWithLots.length} Auctions
            </span>
          </div>
        </div>

        <div className="divide-y divide-gray-100">
          {auctionsLoading ? (
            <div className="p-12 text-center">
              <div className="text-14 text-gray-500">Loading auctions...</div>
            </div>
          ) : auctionsWithLots.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-16 text-gray-500 font-medium mb-2">No auctions with lots available</p>
              <p className="text-14 text-gray-400">Check back later for new bidding opportunities</p>
            </div>
          ) : (
            auctionsWithLots.map((auction: any) => (
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
                        OPEN
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
                        <div className="text-gray-500 text-12 mb-0.5">Available Lots</div>
                        <div className="text-gray-900 font-semibold">{auction.lots_count} lots</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Bidding Closes</div>
                        <div className="text-red-600 font-semibold">{formatDateTime(auction.ends_at).split(' ')[0]}</div>
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

      {/* My Active Bids - Tracking */}
      {myActiveBids && myActiveBids.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-20 font-semibold text-gray-900">My Active Bids</h2>
            <p className="text-14 text-gray-600 mt-0.5">Track your bids in ongoing auctions</p>
          </div>

          <div className="divide-y divide-gray-100">
            {myActiveBids.map((bid: any) => (
              <div key={bid.bid_id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-13 text-gray-500">Bid #{bid.bid_id}</span>
                      <Link
                        href={`/auctions/${bid.auction_id}`}
                        className="text-16 font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                      >
                        {bid.auction_area} Auction
                      </Link>
                      <span className={`px-2 py-1 rounded text-12 font-semibold uppercase ${
                        bid.auction_status === 'open' ? 'bg-green-50 text-green-700 border border-green-200' :
                        bid.auction_status === 'locked' ? 'bg-yellow-50 text-yellow-700 border border-yellow-200' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {bid.auction_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-14">
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Bid Price</div>
                        <div className="text-gray-900 font-semibold">¥{bid.price_yen_kwh.toFixed(2)}/kWh</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Volume</div>
                        <div className="text-gray-900 font-mono">{bid.volume_mwh} MWh</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Status</div>
                        <div className="text-gray-900">
                          {bid.auction_status === 'open' ? 'Auction open' :
                           bid.auction_status === 'locked' ? 'Awaiting clearing' :
                           'Processing'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <Link
                    href={`/auctions/${bid.auction_id}`}
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

      {/* My Awards - What I won */}
      {myClearedBids && myClearedBids.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-20 font-semibold text-gray-900">My Awards</h2>
            <p className="text-14 text-gray-600 mt-0.5">Energy you won from cleared auctions</p>
          </div>

          <div className="divide-y divide-gray-100">
            {myClearedBids.map((bid: any) => (
              <div key={bid.bid_id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-mono text-13 text-gray-500">Bid #{bid.bid_id}</span>
                      <Link
                        href={`/auctions/${bid.auction_id}`}
                        className="text-16 font-semibold text-gray-900 hover:text-green-600 transition-colors"
                      >
                        {bid.auction_area} Auction
                      </Link>
                      <span className="px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-lg text-12 font-semibold uppercase">
                        {bid.auction_status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-14">
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">Bid Amount</div>
                        <div className="text-gray-900">{bid.volume_mwh} MWh @ ¥{bid.price_yen_kwh.toFixed(2)}/kWh</div>
                      </div>
                      {bid.won_volume !== null && bid.won_volume > 0 ? (
                        <>
                          <div>
                            <div className="text-gray-500 text-12 mb-0.5">Won Volume</div>
                            <div className="text-green-600 font-semibold">{bid.won_volume.toFixed(0)} MWh</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-0.5">Cleared Price</div>
                            <div className="text-green-600 font-semibold">¥{bid.cleared_price?.toFixed(2)}/kWh</div>
                          </div>
                        </>
                      ) : (
                        <div className="col-span-2">
                          <div className="text-gray-500 text-12 mb-0.5">Result</div>
                          <div className="text-gray-400">No award</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <Link
                    href={`/auctions/${bid.auction_id}`}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-14 transition-colors"
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
