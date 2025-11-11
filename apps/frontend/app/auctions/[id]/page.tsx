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
    if (!confirm('Lock auction and close bidding window?')) return
    try {
      await api.lockAuction(auctionId)
      await loadData()
    } catch (error) {
      alert('Failed to lock auction')
    }
  }

  const handleClear = async () => {
    if (!confirm('Run clearing algorithm?')) return
    try {
      await api.clearAuction(auctionId)
      await loadData()
    } catch (error) {
      alert('Failed to clear auction')
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
      },
      tooltip: {
        trigger: 'axis',
      },
      legend: {
        data: ['Demand', 'Supply', 'Clearing Price'],
        top: 30,
      },
      xAxis: {
        type: 'value',
        name: 'Volume (MWh)',
        nameLocation: 'middle',
        nameGap: 30,
      },
      yAxis: {
        type: 'value',
        name: 'Price (¥/kWh)',
        nameLocation: 'middle',
        nameGap: 50,
      },
      series: [
        {
          name: 'Demand',
          type: 'line',
          step: 'end',
          data: demandCurve,
          lineStyle: { color: '#dc2626', width: 2 },
        },
        {
          name: 'Supply',
          type: 'line',
          data: [
            [0, 50],
            [totalSupply, 50],
          ],
          lineStyle: { color: '#16a34a', width: 2 },
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
                lineStyle: { color: '#1677FF', width: 2, type: 'dashed' },
              },
            ]
          : []),
      ],
    }
  }

  if (loading) {
    return <div className="text-center py-8">Loading...</div>
  }

  if (!auction) {
    return <div className="text-center py-8">Auction not found</div>
  }

  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, 'yyyy-MM-dd HH:mm JST')
  }

  return (
    <div>
      <Link href="/" className="text-primary hover:underline mb-4 inline-block">
        ← Back to Auctions
      </Link>

      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-32 font-semibold mb-2">
              Auction {auction.auction_id}
            </h1>
            <div className="text-16 text-gray-600 space-y-1">
              <div>Area: {auction.area}</div>
              <div>
                Mode: {auction.mode.replace('_', ' ').toUpperCase()}
              </div>
              <div>Period: {formatDateTime(auction.starts_at)} - {formatDateTime(auction.ends_at)}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-14 text-gray-500 mb-2">Status</div>
            <div className="text-18 font-semibold">{auction.status.toUpperCase()}</div>
          </div>
        </div>

        {auction.status === 'open' && (
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleLock}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600"
            >
              Lock Auction
            </button>
          </div>
        )}

        {auction.status === 'locked' && (
          <div className="pt-4 border-t border-gray-100">
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-primary text-white rounded hover:bg-blue-600"
            >
              Run Clearing
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-24 font-semibold mb-4">Lots ({lots.length})</h2>
          {lots.length === 0 ? (
            <p className="text-gray-500">No lots</p>
          ) : (
            <div className="space-y-3">
              {lots.map((lot) => (
                <div key={lot.lot_id} className="border border-gray-200 rounded p-3">
                  <div className="text-14 space-y-1">
                    <div className="font-semibold">Lot {lot.lot_id}</div>
                    <div>Volume: {lot.min_vol_mwh}-{lot.max_vol_mwh} MWh</div>
                    <div>Reserve: ¥{lot.reserve_price}/kWh</div>
                    <div>Step: {lot.step_mwh} MWh</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-24 font-semibold mb-4">
            Bids {bids.length > 0 && `(${bids.length})`}
          </h2>
          {auction.status === 'open' || auction.status === 'locked' ? (
            <p className="text-gray-500">Sealed until clearing</p>
          ) : bids.length === 0 ? (
            <p className="text-gray-500">No bids</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {bids.map((bid) => (
                <div key={bid.bid_id} className="border border-gray-200 rounded p-3 text-14">
                  <div>Bid {bid.bid_id} - Org {bid.org_id}</div>
                  <div>Price: ¥{bid.price_yen_kwh}/kWh</div>
                  <div>Volume: {bid.volume_mwh} MWh</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {report && (
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
          <h2 className="text-24 font-semibold mb-4">Clearing Report</h2>

          <div className="grid grid-cols-3 gap-6 mb-6">
            <div>
              <div className="text-14 text-gray-500">Cleared Price</div>
              <div className="text-24 font-semibold">
                {report.cleared_price ? `¥${report.cleared_price.toFixed(2)}/kWh` : 'N/A'}
              </div>
            </div>
            <div>
              <div className="text-14 text-gray-500">Cleared Volume</div>
              <div className="text-24 font-semibold">
                {report.cleared_volume.toFixed(1)} MWh
              </div>
            </div>
            <div>
              <div className="text-14 text-gray-500">Matches</div>
              <div className="text-24 font-semibold">{report.matches.length}</div>
            </div>
          </div>

          {getChartOption() && (
            <div className="mb-6">
              <ReactECharts option={getChartOption()!} style={{ height: 400 }} />
            </div>
          )}

          {report.matches.length > 0 && (
            <div>
              <h3 className="text-18 font-semibold mb-3">Matches</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-14">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-2 text-left">Match ID</th>
                      <th className="px-4 py-2 text-left">Lot ID</th>
                      <th className="px-4 py-2 text-left">Bid ID</th>
                      <th className="px-4 py-2 text-right">Price (¥/kWh)</th>
                      <th className="px-4 py-2 text-right">Volume (MWh)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.matches.map((match) => (
                      <tr key={match.match_id} className="border-b">
                        <td className="px-4 py-2">{match.match_id}</td>
                        <td className="px-4 py-2">{match.lot_id}</td>
                        <td className="px-4 py-2">{match.bid_id}</td>
                        <td className="px-4 py-2 text-right">
                          {match.cleared_price.toFixed(2)}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {match.cleared_volume.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
