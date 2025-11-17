'use client'

import { useMarketStats } from '@/lib/hooks'

export default function MarketOverview() {
  const { data: stats, loading, error } = useMarketStats()

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
          <div className="grid grid-cols-3 gap-6">
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
            <div className="h-24 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="text-14 text-gray-500">Unable to load market statistics</div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-100">
        <h2 className="text-18 font-semibold text-gray-900">Market Overview</h2>
        <p className="text-14 text-gray-600 mt-0.5">Current market conditions and recent activity</p>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-3 gap-6 mb-6">
          {/* Active Regions */}
          <div>
            <div className="text-12 text-gray-500 mb-2 uppercase tracking-wide font-semibold">Active Regions</div>
            {stats.active_regions && stats.active_regions.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {stats.active_regions.map((region: string) => (
                  <span
                    key={region}
                    className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-13 font-medium"
                  >
                    {region}
                  </span>
                ))}
              </div>
            ) : (
              <div className="text-14 text-gray-400">No active regions</div>
            )}
          </div>

          {/* Average Cleared Price */}
          <div>
            <div className="text-12 text-gray-500 mb-2 uppercase tracking-wide font-semibold">Avg Cleared Price</div>
            {stats.avg_cleared_price !== null ? (
              <div className="text-28 font-bold text-gray-900">
                ¥{stats.avg_cleared_price.toFixed(2)}
                <span className="text-16 text-gray-500 font-normal ml-1">/kWh</span>
              </div>
            ) : (
              <div className="text-14 text-gray-400">No data yet</div>
            )}
            <div className="text-12 text-gray-500 mt-1">Last 5 auctions</div>
          </div>

          {/* Total Volume Traded */}
          <div>
            <div className="text-12 text-gray-500 mb-2 uppercase tracking-wide font-semibold">Total Volume</div>
            {stats.total_volume_traded > 0 ? (
              <div className="text-28 font-bold text-gray-900">
                {stats.total_volume_traded.toFixed(0)}
                <span className="text-16 text-gray-500 font-normal ml-1">MWh</span>
              </div>
            ) : (
              <div className="text-14 text-gray-400">No volume yet</div>
            )}
            <div className="text-12 text-gray-500 mt-1">Last 5 auctions</div>
          </div>
        </div>

        {/* Recent Clearings */}
        {stats.recent_clearings && stats.recent_clearings.length > 0 && (
          <div>
            <div className="text-12 text-gray-500 mb-3 uppercase tracking-wide font-semibold">Recent Clearings</div>
            <div className="space-y-2">
              {stats.recent_clearings.map((clearing: any) => (
                <div
                  key={clearing.auction_id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-13 text-gray-500">#{clearing.auction_id}</span>
                    <span className="text-14 font-medium text-gray-900">{clearing.area}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-14 font-semibold text-green-600">
                        ¥{clearing.cleared_price.toFixed(2)}/kWh
                      </div>
                      <div className="text-12 text-gray-500">{clearing.cleared_volume.toFixed(0)} MWh</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
