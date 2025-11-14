'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Interview } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'
import Breadcrumbs from '@/components/Breadcrumbs'

const TOKYO_TZ = 'Asia/Tokyo'

type StatusFilter = 'all' | 'scheduled' | 'completed' | 'cancelled'

export default function InterviewsList() {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')

  useEffect(() => {
    loadInterviews()
  }, [])

  const loadInterviews = async () => {
    try {
      const data = await api.getInterviews()
      setInterviews(data)
      setError(null)
    } catch (error) {
      console.error('Failed to load interviews:', error)
      setError('Failed to connect to API. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, 'yyyy-MM-dd HH:mm') + ' JST'
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      scheduled: 'bg-blue-50 text-blue-700 border-blue-200',
      completed: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-gray-100 text-gray-700 border-gray-200',
    }
    return colors[status as keyof typeof colors] || colors.scheduled
  }

  // Calculate statistics
  const stats = {
    total: interviews.length,
    scheduled: interviews.filter(i => i.status === 'scheduled').length,
    completed: interviews.filter(i => i.status === 'completed').length,
    cancelled: interviews.filter(i => i.status === 'cancelled').length,
  }

  // Filter interviews
  const filteredInterviews = statusFilter === 'all'
    ? interviews
    : interviews.filter(i => i.status === statusFilter)

  // Sort by date (upcoming first)
  const sortedInterviews = [...filteredInterviews].sort((a, b) => {
    return new Date(a.when_ts).getTime() - new Date(b.when_ts).getTime()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600">Loading interviews...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Interviews (面談)' }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-32 font-bold text-gray-900 mb-2">Interviews (面談)</h1>
            <p className="text-16 text-gray-600">
              Scheduled meetings between buyers and sellers to finalize auction deals
            </p>
          </div>
          <Link
            href="/interviews/create"
            className="px-5 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium transition-colors text-14 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Schedule New Interview
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Total</div>
            <div className="text-28 font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-blue-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Scheduled</div>
            <div className="text-28 font-bold text-blue-600">{stats.scheduled}</div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Completed</div>
            <div className="text-28 font-bold text-green-600">{stats.completed}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Cancelled</div>
            <div className="text-28 font-bold text-gray-500">{stats.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-1">Connection Error</p>
              <p className="text-red-600 text-14 mb-3">{error}</p>
              <button
                onClick={loadInterviews}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-14 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Interviews Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-20 font-semibold">All Interviews</h2>

            {/* Status Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'scheduled', 'completed', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-14 font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? `All (${stats.total})` : `${status.charAt(0).toUpperCase() + status.slice(1)}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {sortedInterviews.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-gray-500 font-medium mb-2">
                {error ? 'No connection to backend' : 'No interviews found'}
              </p>
              <p className="text-14 text-gray-400 mb-4">
                {error
                  ? 'Please ensure the API server is running'
                  : statusFilter === 'all'
                    ? 'Schedule your first interview from a cleared auction'
                    : `No interviews with status "${statusFilter}"`
                }
              </p>
              {!error && statusFilter === 'all' && (
                <Link
                  href="/"
                  className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium text-14"
                >
                  Go to Auctions
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedInterviews.map((interview) => {
                const isUpcoming = new Date(interview.when_ts) > new Date()
                const isPast = new Date(interview.when_ts) <= new Date()

                return (
                  <div
                    key={interview.iv_id}
                    className="border border-gray-200 rounded-lg p-5 hover:border-indigo-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-16 font-semibold text-gray-900">
                            Interview #{interview.iv_id}
                          </h3>
                          <span className={`px-3 py-1 rounded-lg border text-12 font-medium ${getStatusBadge(interview.status)}`}>
                            {interview.status.toUpperCase()}
                          </span>
                          {interview.status === 'scheduled' && isUpcoming && (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-11 font-medium">
                              Upcoming
                            </span>
                          )}
                          {interview.status === 'scheduled' && isPast && (
                            <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-11 font-medium">
                              Overdue
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-6 text-14 mb-3">
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Match ID</div>
                            <div className="font-mono text-gray-900">#{interview.match_id}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Scheduled Date</div>
                            <div className="font-medium text-gray-900">
                              {formatDateTime(interview.when_ts)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Contact</div>
                            <div className="text-gray-900">
                              {interview.contact || '—'}
                            </div>
                          </div>
                        </div>

                        {interview.notes && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="text-11 text-gray-500 mb-1 uppercase tracking-wide">Notes</div>
                            <p className="text-13 text-gray-700 whitespace-pre-wrap">{interview.notes}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        <div className="text-11 text-gray-500 text-right">
                          Created {formatDateTime(interview.created_at).split(' ')[0]}
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

      {/* Back to Dashboard */}
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-14 text-gray-600 hover:text-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
