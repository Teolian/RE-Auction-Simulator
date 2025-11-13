'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { api, Auction, Lot, Bid, Report } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'
import ReactECharts from 'echarts-for-react'

const TOKYO_TZ = 'Asia/Tokyo'

export default function AuctionDetail() {
  const params = useParams()
  const auctionId = parseInt(params.id as string)

  const [auction, setAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [auctionId])

  const loadData = async () => {
    try {
      const [auctionData, lotsData] = await Promise.all([
        api.getAuction(auctionId),
        api.getLots(auctionId),
      ])
      setAuction(auctionData)
      setLots(lotsData)

      if (auctionData.status === 'cleared' || auctionData.status === 'published') {
        const reportData = await api.getReport(auctionId)
        setReport(reportData)
        const bidsData = await api.getBids(auctionId)
        setBids(bidsData)
      }
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLock = async () => {
    if (!confirm('Lock auction and close bidding window?\n\nThis action cannot be undone.')) return
    setProcessing(true)
    try {
      await api.lockAuction(auctionId)
      await loadData()
      alert('Auction locked successfully')
    } catch (error) {
      alert('Failed to lock auction: ' + (error as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Run clearing algorithm?\n\nThis will match lots with bids and cannot be undone.')) return
    setProcessing(true)
    try {
      await api.clearAuction(auctionId)
      await loadData()
      alert('Clearing completed successfully')
    } catch (error) {
      alert('Failed to clear auction: ' + (error as Error).message)
    } finally {
      setProcessing(false)
    }
  }

  const getChartOption = () => {
    if (!report || bids.length === 0) return null

    const sortedBids = [...bids].sort((a, b) => b.price_yen_kwh - a.price_yen_kwh)
    let cumulative = 0
    const demandCurve = sortedBids.map((bid) => {
      cumulative += bid.volume_mwh
      return [cumulative, bid.price_yen_kwh]
    })

    const totalSupply = lots.reduce((sum, lot) => sum + lot.max_vol_mwh, 0)

    return {
      title: {
        text: 'Supply & Demand Curve',
        left: 'center',
        textStyle: {
          fontSize: 18,
          fontWeight: 600,
        },
      },
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          const data = params[0]
          return `Volume: ${data.value[0].toFixed(1)} MWh<br/>Price: ¥${data.value[1].toFixed(2)}/kWh`
        },
      },
      legend: {
        data: ['Demand', 'Supply', 'Clearing Price'],
        top: 40,
      },
      grid: {
        left: 80,
        right: 40,
        top: 80,
        bottom: 60,
      },
      xAxis: {
        type: 'value',
        name: 'Volume (MWh)',
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
      yAxis: {
        type: 'value',
        name: 'Price (¥/kWh)',
        nameLocation: 'middle',
        nameGap: 60,
        nameTextStyle: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
      series: [
        {
          name: 'Demand',
          type: 'line',
          step: 'end',
          data: demandCurve,
          lineStyle: { color: '#dc2626', width: 2 },
          itemStyle: { color: '#dc2626' },
        },
        {
          name: 'Supply',
          type: 'line',
          data: [
            [0, Math.max(...sortedBids.map(b => b.price_yen_kwh))],
            [totalSupply, Math.max(...sortedBids.map(b => b.price_yen_kwh))],
          ],
          lineStyle: { color: '#16a34a', width: 2 },
          itemStyle: { color: '#16a34a' },
        },
        ...(report.cleared_price
          ? [
              {
                name: 'Clearing Price',
                type: 'line',
                data: [
                  [0, report.cleared_price],
                  [totalSupply, report.cleared_price],
                ],
                lineStyle: { color: '#1677FF', width: 3, type: 'dashed' },
                itemStyle: { color: '#1677FF' },
              },
            ]
          : []),
      ],
    }
  }

  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, "yyyy-MM-dd HH:mm 'JST'")
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600">Loading auction details...</div>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600 mb-4">Auction not found</div>
          <Link href="/" className="text-primary hover:underline">
            ← Back to Auctions
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-14 text-primary hover:underline">
          ← Back to Auctions
        </Link>
      </div>

      {/* Auction Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-32 font-semibold mb-3">
              {auction.area} Auction
            </h1>
            <div className="text-16 text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">ID:</span>
                <span>#{auction.auction_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Mode:</span>
                <span className="font-mono">{auction.mode.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Period:</span>
                <span>{formatDateTime(auction.starts_at)} → {formatDateTime(auction.ends_at)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-12 text-gray-500 mb-2 uppercase tracking-wide">Status</div>
            <div className={`px-4 py-2 rounded-lg border font-semibold text-16 ${getStatusBadge(auction.status)}`}>
              {auction.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {auction.status === 'open' && (
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLock}
                disabled={processing}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Lock Auction'}
              </button>
              <p className="text-14 text-gray-500">
                Close the bidding window and prepare for clearing
              </p>
            </div>
          </div>
        )}

        {auction.status === 'locked' && (
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <button
                onClick={handleClear}
                disabled={processing}
                className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-blue-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Run Clearing'}
              </button>
              <p className="text-14 text-gray-500">
                Execute the matching algorithm
              </p>
            </div>
          </div>
        )}

        {auction.status === 'cleared' && report && (
          <div className="pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Cleared Price</div>
                <div className="text-24 font-semibold text-primary">
                  {report.cleared_price ? `¥${report.cleared_price.toFixed(2)}/kWh` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Cleared Volume</div>
                <div className="text-24 font-semibold text-green-600">
                  {report.cleared_volume.toFixed(1)} MWh
                </div>
              </div>
              <div>
                <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Total Matches</div>
                <div className="text-24 font-semibold text-gray-900">
                  {report.matches.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lots and Bids Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Lots Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-18 font-semibold">Lots ({lots.length})</h2>
          </div>
          <div className="p-6">
            {lots.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No lots available
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-14">
                  <thead className="bg-gray-50 border-b text-12 text-gray-600 uppercase tracking-wide">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">ID</th>
                      <th className="px-3 py-2 text-right font-medium">Min (MWh)</th>
                      <th className="px-3 py-2 text-right font-medium">Max (MWh)</th>
                      <th className="px-3 py-2 text-right font-medium">Reserve (¥/kWh)</th>
                      <th className="px-3 py-2 text-center font-medium">Partial</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {lots.map((lot) => (
                      <tr key={lot.lot_id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono">#{lot.lot_id}</td>
                        <td className="px-3 py-3 text-right">{lot.min_vol_mwh.toFixed(1)}</td>
                        <td className="px-3 py-3 text-right">{lot.max_vol_mwh.toFixed(1)}</td>
                        <td className="px-3 py-3 text-right font-medium">¥{lot.reserve_price.toFixed(2)}</td>
                        <td className="px-3 py-3 text-center">
                          {lot.allow_partial ? (
                            <span className="text-green-600">✓</span>
                          ) : (
                            <span className="text-gray-400">✗</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Bids Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-18 font-semibold">
              Bids {bids.length > 0 && `(${bids.length})`}
            </h2>
          </div>
          <div className="p-6">
            {auction.status === 'open' || auction.status === 'locked' || auction.status === 'draft' ? (
              <div className="text-center py-8">
                <div className="text-gray-400 mb-2">
                  <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <p className="text-gray-600 font-medium">Sealed until clearing</p>
                <p className="text-14 text-gray-500 mt-1">Bids will be visible after auction is cleared</p>
              </div>
            ) : bids.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No bids found
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-14">
                  <thead className="bg-gray-50 border-b text-12 text-gray-600 uppercase tracking-wide sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">ID</th>
                      <th className="px-3 py-2 text-left font-medium">Org</th>
                      <th className="px-3 py-2 text-right font-medium">Price (¥/kWh)</th>
                      <th className="px-3 py-2 text-right font-medium">Volume (MWh)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bids.map((bid) => (
                      <tr key={bid.bid_id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono">#{bid.bid_id}</td>
                        <td className="px-3 py-3">Org {bid.org_id}</td>
                        <td className="px-3 py-3 text-right font-medium">¥{bid.price_yen_kwh.toFixed(2)}</td>
                        <td className="px-3 py-3 text-right">{bid.volume_mwh.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Clearing Report */}
      {report && (
        <div className="bg-white rounded-lg border border-gray-200 mb-6">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-24 font-semibold">Clearing Report</h2>
          </div>
          <div className="p-6">
            {/* Supply & Demand Chart */}
            {getChartOption() && (
              <div className="mb-8 border border-gray-100 rounded-lg p-4">
                <ReactECharts option={getChartOption()!} style={{ height: 450 }} />
              </div>
            )}

            {/* Matches Table */}
            {report.matches.length > 0 && (
              <div>
                <h3 className="text-18 font-semibold mb-4">Matches ({report.matches.length})</h3>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-14">
                    <thead className="bg-gray-50 border-b text-12 text-gray-600 uppercase tracking-wide">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Match ID</th>
                        <th className="px-4 py-3 text-left font-medium">Lot ID</th>
                        <th className="px-4 py-3 text-left font-medium">Bid ID</th>
                        <th className="px-4 py-3 text-right font-medium">Price (¥/kWh)</th>
                        <th className="px-4 py-3 text-right font-medium">Volume (MWh)</th>
                        <th className="px-4 py-3 text-left font-medium">Notes</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {report.matches.map((match) => (
                        <tr key={match.match_id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-mono">#{match.match_id}</td>
                          <td className="px-4 py-3 font-mono">#{match.lot_id}</td>
                          <td className="px-4 py-3 font-mono">#{match.bid_id}</td>
                          <td className="px-4 py-3 text-right font-medium text-primary">
                            ¥{match.cleared_price.toFixed(2)}
                          </td>
                          <td className="px-4 py-3 text-right font-medium">
                            {match.cleared_volume.toFixed(1)}
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-12">
                            {match.notes || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
