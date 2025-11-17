'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { api, Auction, Lot, Bid, Report, Plant } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'
import ReactECharts from 'echarts-for-react'
import Breadcrumbs from '@/components/Breadcrumbs'

const TOKYO_TZ = 'Asia/Tokyo'

export default function AuctionDetail() {
  const t = useTranslations()
  const params = useParams()
  const auctionId = parseInt(params.id as string)

  const [auction, setAuction] = useState<Auction | null>(null)
  const [lots, setLots] = useState<Lot[]>([])
  const [plants, setPlants] = useState<Plant[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [report, setReport] = useState<Report | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    loadData()
  }, [auctionId])

  const loadData = async () => {
    try {
      const [auctionData, lotsData, plantsData] = await Promise.all([
        api.getAuction(auctionId),
        api.getLots(auctionId),
        api.getPlants(),
      ])
      setAuction(auctionData)
      setLots(lotsData)
      setPlants(plantsData)

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

  const handleOpen = async () => {
    if (!confirm('Open this auction for bidding?\n\nMake sure all lots are configured correctly.')) return
    setProcessing(true)
    try {
      await api.openAuction(auctionId)
      await loadData()
      alert('Auction opened successfully. Bidding window is now active.')
    } catch (error) {
      alert('Failed to open auction: ' + (error as Error).message)
    } finally {
      setProcessing(false)
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

  const getPlantInfo = (plantId: number) => {
    return plants.find(p => p.plant_id === plantId)
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
        text: t('auctionDetail.supplyDemandCurve'),
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
          return `${t('auctionDetail.volume')}: ${data.value[0].toFixed(1)} MWh<br/>${t('auctionDetail.price')}: ¥${data.value[1].toFixed(2)}/kWh`
        },
      },
      legend: {
        data: [t('auctionDetail.demand'), t('auctionDetail.supply'), t('auctionDetail.clearingPrice')],
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
        name: t('auctionDetail.volumeMWh'),
        nameLocation: 'middle',
        nameGap: 40,
        nameTextStyle: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
      yAxis: {
        type: 'value',
        name: t('auctionDetail.priceYenKWh'),
        nameLocation: 'middle',
        nameGap: 60,
        nameTextStyle: {
          fontSize: 14,
          fontWeight: 500,
        },
      },
      series: [
        {
          name: t('auctionDetail.demand'),
          type: 'line',
          step: 'end',
          data: demandCurve,
          lineStyle: { color: '#dc2626', width: 2 },
          itemStyle: { color: '#dc2626' },
        },
        {
          name: t('auctionDetail.supply'),
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
                name: t('auctionDetail.clearingPrice'),
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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600">{t('auctionDetail.loadingDetails')}</div>
        </div>
      </div>
    )
  }

  if (!auction) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600 mb-4">{t('auctionDetail.notFound')}</div>
          <Link href="/" className="text-primary hover:underline">
            {t('auctionDetail.backToAuctions')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Breadcrumbs */}
      <Breadcrumbs items={[
        { label: t('navigation.dashboard'), href: '/' },
        { label: t('navigation.auctions'), href: '/' },
        { label: `${auction.area} ${t('common.auctions')} #${auctionId}` }
      ]} />

      {/* Auction Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-32 font-semibold mb-3">
              {auction.area} {t('common.auctions')}
            </h1>
            <div className="text-16 text-gray-600 space-y-2">
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('auction.id')}:</span>
                <span>#{auction.auction_id}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('auction.mode')}:</span>
                <span className="font-mono">{auction.mode.replace('_', ' ').toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{t('auctionDetail.period')}:</span>
                <span>{formatDateTime(auction.starts_at)} → {formatDateTime(auction.ends_at)}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-12 text-gray-500 mb-2 uppercase tracking-wide">{t('auction.status')}</div>
            <div className={`px-4 py-2 rounded-lg border font-semibold text-16 ${getStatusBadge(auction.status)}`}>
              {auction.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {auction.status === 'draft' && (
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <button
                onClick={handleOpen}
                disabled={processing || lots.length === 0}
                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? t('auctionDetail.processing') : t('auctionDetail.openAuction')}
              </button>
              <p className="text-14 text-gray-500">
                {lots.length === 0
                  ? t('auctionDetail.addLotFirst')
                  : t('auctionDetail.startBiddingWindow')}
              </p>
            </div>
          </div>
        )}

        {auction.status === 'open' && (
          <div className="pt-6 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <button
                onClick={handleLock}
                disabled={processing}
                className="px-6 py-3 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? t('auctionDetail.processing') : t('auction.lockAuction')}
              </button>
              <p className="text-14 text-gray-500">
                {t('auctionDetail.closeBiddingWindow')}
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
                {processing ? t('auctionDetail.processing') : t('auction.runClearing')}
              </button>
              <p className="text-14 text-gray-500">
                {t('auctionDetail.executeMatching')}
              </p>
            </div>
          </div>
        )}

        {auction.status === 'cleared' && report && (
          <div className="pt-6 border-t border-gray-100">
            <div className="grid grid-cols-3 gap-6">
              <div>
                <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">{t('auctionDetail.clearedPrice')}</div>
                <div className="text-24 font-semibold text-primary">
                  {report.cleared_price ? `¥${report.cleared_price.toFixed(2)}/kWh` : 'N/A'}
                </div>
              </div>
              <div>
                <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">{t('auctionDetail.clearedVolume')}</div>
                <div className="text-24 font-semibold text-green-600">
                  {report.cleared_volume.toFixed(1)} MWh
                </div>
              </div>
              <div>
                <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">{t('auctionDetail.totalMatches')}</div>
                <div className="text-24 font-semibold text-gray-900">
                  {report.matches.length}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      {(auction.status === 'draft' || auction.status === 'open') && (
        <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg border border-gray-200 p-6 mb-6">
          <h3 className="text-18 font-semibold mb-3">{t('auctionDetail.quickActions')}</h3>
          <div className="flex flex-wrap gap-3">
            {auction.status === 'draft' && (
              <Link
                href={`/lots/create?auction_id=${auctionId}`}
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium transition-colors text-14 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('auctionDetail.addLotToAuction')}
              </Link>
            )}
            {auction.status === 'open' && (
              <Link
                href={`/bids/create?auction_id=${auctionId}`}
                className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors text-14 flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {t('auctionDetail.submitBid')}
              </Link>
            )}
            <Link
              href="/"
              className="px-5 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors text-14 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              {t('auctionDetail.backToDashboard')}
            </Link>
          </div>
        </div>
      )}

      {/* Lots and Bids Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Lots Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex justify-between items-center">
              <h2 className="text-18 font-semibold">{t('auction.lots')} ({lots.length})</h2>
              {auction.status === 'draft' && (
                <Link
                  href={`/lots/create?auction_id=${auctionId}`}
                  className="text-14 text-green-600 hover:text-green-700 font-medium"
                >
                  {t('auctionDetail.addLot')}
                </Link>
              )}
            </div>
          </div>
          <div className="p-6">
            {lots.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="text-gray-500 font-medium mb-2">{t('auctionDetail.noLotsYet')}</p>
                {auction.status === 'draft' && (
                  <Link
                    href={`/lots/create?auction_id=${auctionId}`}
                    className="inline-block text-14 text-green-600 hover:underline"
                  >
                    {t('auctionDetail.addFirstLot')}
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {lots.map((lot) => {
                  const plant = getPlantInfo(lot.plant_id)
                  return (
                    <div key={lot.lot_id} className="border border-gray-200 rounded-lg p-4 hover:border-primary transition-colors">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="text-12 text-gray-500 mb-1">{t('lot.id')} #{lot.lot_id}</div>
                          {plant && (
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-11 font-medium ${
                                plant.type === 'pv' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {plant.type === 'pv' ? t('auctionDetail.solarPV') : t('auctionDetail.wind')}
                              </span>
                              <span className="text-13 text-gray-700">{plant.ac_mw} MW</span>
                              {plant.prefecture && (
                                <span className="text-13 text-gray-500">• {plant.prefecture}</span>
                              )}
                            </div>
                          )}
                        </div>
                        {lot.allow_partial && (
                          <span className="px-2 py-1 bg-green-50 text-green-700 text-11 rounded font-medium">
                            {t('auctionDetail.partialOK')}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-13">
                        <div>
                          <div className="text-gray-500 text-11 mb-0.5">{t('auctionDetail.volumeRange')}</div>
                          <div className="font-semibold text-gray-900">
                            {lot.min_vol_mwh.toFixed(1)} - {lot.max_vol_mwh.toFixed(1)} MWh
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-11 mb-0.5">{t('auctionDetail.reservePrice')}</div>
                          <div className="font-semibold text-primary">
                            ¥{lot.reserve_price.toFixed(2)}/kWh
                          </div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-11 mb-0.5">{t('auctionDetail.stepSize')}</div>
                          <div className="font-medium text-gray-700">
                            {lot.step_mwh.toFixed(2)} MWh
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bids Section */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-18 font-semibold">
              {t('auction.bids')} {bids.length > 0 && `(${bids.length})`}
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
                <p className="text-gray-600 font-medium">{t('auctionDetail.sealedUntilClearing')}</p>
                <p className="text-14 text-gray-500 mt-1">{t('auctionDetail.bidsVisibleAfterClearing')}</p>
              </div>
            ) : bids.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                {t('auctionDetail.noBidsFound')}
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table className="w-full text-14">
                  <thead className="bg-gray-50 border-b text-12 text-gray-600 uppercase tracking-wide sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">{t('bid.id')}</th>
                      <th className="px-3 py-2 text-left font-medium">{t('auctionDetail.org')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('auctionDetail.price')}</th>
                      <th className="px-3 py-2 text-right font-medium">{t('auctionDetail.volume')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {bids.map((bid) => (
                      <tr key={bid.bid_id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 font-mono">#{bid.bid_id}</td>
                        <td className="px-3 py-3">{t('auctionDetail.org')} {bid.org_id}</td>
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
            <h2 className="text-24 font-semibold">{t('auctionDetail.clearingReport')}</h2>
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
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-18 font-semibold">{t('auctionDetail.matches')} ({report.matches.length})</h3>
                  <div className="flex items-center gap-2 text-14 text-gray-600">
                    <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>{t('auctionDetail.scheduleInterviews')}</span>
                  </div>
                </div>
                <div className="overflow-x-auto border border-gray-200 rounded-lg">
                  <table className="w-full text-14">
                    <thead className="bg-gray-50 border-b text-12 text-gray-600 uppercase tracking-wide">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">{t('auctionDetail.matchId')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('auctionDetail.lotId')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('auctionDetail.bidId')}</th>
                        <th className="px-4 py-3 text-right font-medium">{t('auctionDetail.price')}</th>
                        <th className="px-4 py-3 text-right font-medium">{t('auctionDetail.volume')}</th>
                        <th className="px-4 py-3 text-left font-medium">{t('auctionDetail.notes')}</th>
                        <th className="px-4 py-3 text-center font-medium">{t('auctionDetail.action')}</th>
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
                          <td className="px-4 py-3 text-center">
                            <Link
                              href={`/interviews/create?match_id=${match.match_id}`}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-12 rounded-lg hover:bg-indigo-700 font-medium transition-colors"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              {t('auctionDetail.scheduleInterview')}
                            </Link>
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
    </>
  )
}
