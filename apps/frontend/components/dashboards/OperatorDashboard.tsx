'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useAuctionsWithCounts } from '@/lib/hooks'
import { formatInTimeZone } from 'date-fns-tz'

const TOKYO_TZ = 'Asia/Tokyo'

export default function OperatorDashboard() {
  const t = useTranslations()
  const { data: auctions, loading, error } = useAuctionsWithCounts({})
  const [processingAuction, setProcessingAuction] = useState<number | null>(null)
  const [refreshKey, setRefreshKey] = useState(0)

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

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1)
    window.location.reload() // Simple reload for now
  }

  const handleLockAuction = async (auctionId: number) => {
    setProcessingAuction(auctionId)
    try {
      const response = await fetch(`http://localhost:8000/api/auctions/${auctionId}/lock`, {
        method: 'POST',
      })
      if (response.ok) {
        handleRefresh()
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
        handleRefresh()
      }
    } catch (error) {
      console.error('Failed to run clearing:', error)
    } finally {
      setProcessingAuction(null)
    }
  }

  // Statistics
  const stats = {
    total: auctions?.length || 0,
    open: auctions?.filter((a: any) => a.status === 'open').length || 0,
    locked: auctions?.filter((a: any) => a.status === 'locked').length || 0,
    cleared: auctions?.filter((a: any) => a.status === 'cleared' || a.status === 'published').length || 0,
  }

  // Action queue - auctions that need operator attention
  const actionQueue = auctions?.filter((a: any) =>
    a.status === 'locked' || (a.status === 'open' && a.bids_count > 0)
  ) || []

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-32 font-bold text-gray-900">{t('dashboard.operator.title')}</h1>
          <p className="text-16 text-gray-600 mt-1">{t('dashboard.operator.subtitle')}</p>
        </div>
        <Link
          href="/auctions/create"
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold text-16 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {t('dashboard.operator.createAuction')}
        </Link>
      </div>

      {/* System Health Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide font-semibold">{t('dashboard.operator.totalAuctions')}</div>
          <div className="text-32 font-bold text-gray-900">{stats.total}</div>
        </div>
        <div className="bg-green-50 rounded-lg border border-green-200 p-5">
          <div className="text-12 text-green-700 mb-1 uppercase tracking-wide font-semibold">{t('dashboard.operator.open')}</div>
          <div className="text-32 font-bold text-green-700">{stats.open}</div>
          <div className="text-12 text-green-600 mt-1">{t('dashboard.operator.acceptingBids')}</div>
        </div>
        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-5">
          <div className="text-12 text-yellow-700 mb-1 uppercase tracking-wide font-semibold">{t('dashboard.operator.locked')}</div>
          <div className="text-32 font-bold text-yellow-700">{stats.locked}</div>
          <div className="text-12 text-yellow-600 mt-1">{t('dashboard.operator.readyForClearing')}</div>
        </div>
        <div className="bg-blue-50 rounded-lg border border-blue-200 p-5">
          <div className="text-12 text-blue-700 mb-1 uppercase tracking-wide font-semibold">{t('dashboard.operator.cleared')}</div>
          <div className="text-32 font-bold text-blue-700">{stats.cleared}</div>
          <div className="text-12 text-blue-600 mt-1">{t('dashboard.operator.resultsPublished')}</div>
        </div>
      </div>

      {/* Action Queue - What needs attention */}
      {actionQueue.length > 0 && (
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200">
          <div className="px-6 py-4 border-b border-purple-200 bg-white/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <svg className="w-6 h-6 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
                </svg>
                <div>
                  <h2 className="text-20 font-semibold text-gray-900">{t('dashboard.operator.actionQueue')}</h2>
                  <p className="text-14 text-gray-600 mt-0.5">{t('dashboard.operator.actionQueueDesc')}</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-purple-600 text-white rounded-lg text-14 font-semibold">
                {actionQueue.length} {t('dashboard.operator.pending')}
              </span>
            </div>
          </div>

          <div className="divide-y divide-purple-100">
            {actionQueue.map((auction: any) => {
              const isLocked = auction.status === 'locked'
              return (
                <div key={auction.auction_id} className="p-5 bg-white/70 hover:bg-white transition-colors">
                  <div className="flex items-start justify-between gap-6">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {isLocked && (
                          <svg className="w-5 h-5 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
                          </svg>
                        )}
                        <Link
                          href={`/auctions/${auction.auction_id}`}
                          className="text-18 font-semibold text-gray-900 hover:text-purple-600 transition-colors"
                        >
                          {auction.area} Auction
                        </Link>
                        <span className={`px-3 py-1 rounded-lg border text-12 font-semibold uppercase ${getStatusBadge(auction.status)}`}>
                          {auction.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-14">
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">{t('auction.id')}</div>
                          <div className="font-mono text-gray-900">#{auction.auction_id}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">{t('auction.lots')} / {t('auction.bids')}</div>
                          <div className="text-gray-900 font-semibold">{auction.lots_count} / {auction.bids_count}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">{t('dashboard.operator.actionNeeded')}</div>
                          <div className={isLocked ? 'text-purple-600 font-semibold' : 'text-yellow-600 font-semibold'}>
                            {isLocked ? t('auction.runClearing') : t('dashboard.operator.readyToLock')}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {auction.status === 'open' && (
                        <button
                          onClick={() => handleLockAuction(auction.auction_id)}
                          disabled={processingAuction === auction.auction_id}
                          className="px-5 py-2.5 bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg font-semibold text-14 transition-colors disabled:opacity-50"
                        >
                          {processingAuction === auction.auction_id ? t('auction.locking') : t('auction.lockAuction')}
                        </button>
                      )}
                      {auction.status === 'locked' && (
                        <button
                          onClick={() => handleRunClearing(auction.auction_id)}
                          disabled={processingAuction === auction.auction_id}
                          className="px-5 py-2.5 bg-purple-600 text-white hover:bg-purple-700 rounded-lg font-semibold text-14 transition-colors disabled:opacity-50 shadow-lg"
                        >
                          {processingAuction === auction.auction_id ? t('auction.running') : t('auction.runClearing')}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* All Auctions - Pipeline View */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-20 font-semibold text-gray-900">{t('dashboard.operator.allAuctions')}</h2>
          <p className="text-14 text-gray-600 mt-0.5">{t('dashboard.operator.allAuctionsDesc')}</p>
        </div>

        <div className="divide-y divide-gray-100">
          {loading ? (
            <div className="p-12 text-center">
              <div className="text-14 text-gray-500">{t('common.loading')}</div>
            </div>
          ) : auctions && auctions.length === 0 ? (
            <div className="p-12 text-center">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="text-16 text-gray-500 font-medium mb-2">{t('dashboard.operator.noAuctions')}</p>
              <p className="text-14 text-gray-400 mb-4">{t('dashboard.operator.noAuctionsDesc')}</p>
              <Link
                href="/auctions/create"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-14 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                {t('dashboard.operator.createAuction')}
              </Link>
            </div>
          ) : (
            auctions?.map((auction: any) => (
              <div key={auction.auction_id} className="p-5 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between gap-6">
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

                    <div className="grid grid-cols-5 gap-4 text-14">
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">{t('auction.id')}</div>
                        <div className="font-mono text-gray-900">#{auction.auction_id}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">{t('auction.lots')}</div>
                        <div className="text-gray-900 font-semibold">{auction.lots_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">{t('auction.bids')}</div>
                        <div className="text-gray-900 font-semibold">{auction.bids_count || 0}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 text-12 mb-0.5">{t('auction.closes')}</div>
                        <div className="text-gray-900">{formatDateTime(auction.ends_at).split(' ')[0]}</div>
                      </div>
                      {auction.cleared_price !== null && (
                        <div>
                          <div className="text-gray-500 text-12 mb-0.5">{t('dashboard.operator.cleared')}</div>
                          <div className="font-semibold text-purple-600">
                            ¥{auction.cleared_price.toFixed(2)}/kWh
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
                      {t('auction.viewDetails')}
                    </Link>

                    {auction.status === 'open' && (
                      <button
                        onClick={() => handleLockAuction(auction.auction_id)}
                        disabled={processingAuction === auction.auction_id}
                        className="px-5 py-2.5 bg-yellow-600 text-white hover:bg-yellow-700 rounded-lg font-semibold text-14 transition-colors disabled:opacity-50"
                      >
                        {processingAuction === auction.auction_id ? t('auction.locking') : t('auction.lock')}
                      </button>
                    )}

                    {auction.status === 'locked' && (
                      <button
                        onClick={() => handleRunClearing(auction.auction_id)}
                        disabled={processingAuction === auction.auction_id}
                        className="px-5 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-lg font-semibold text-14 transition-colors disabled:opacity-50"
                      >
                        {processingAuction === auction.auction_id ? t('auction.running') : t('auction.clear')}
                      </button>
                    )}

                    {(auction.status === 'cleared' || auction.status === 'published') && (
                      <Link
                        href={`/auctions/${auction.auction_id}`}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-medium text-14 transition-colors"
                      >
                        {t('auction.viewReport')}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
