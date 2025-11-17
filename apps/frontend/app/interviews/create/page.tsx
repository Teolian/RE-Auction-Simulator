'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api, Match } from '@/lib/api'
import Breadcrumbs from '@/components/Breadcrumbs'

export default function CreateInterview() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [match, setMatch] = useState<Match | null>(null)

  const [formData, setFormData] = useState({
    match_id: searchParams.get('match_id') || '',
    when_ts: '',
    contact: '',
    notes: '',
  })

  useEffect(() => {
    if (formData.match_id) {
      loadMatchData()
    } else {
      setDataLoading(false)
    }
  }, [])

  const loadMatchData = async () => {
    try {
      // In production, would have an endpoint to get single match
      // For now, just validate the match_id is valid
      setDataLoading(false)
    } catch (err) {
      console.error('Failed to load match:', err)
      setError('Failed to load match data')
      setDataLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.match_id) {
      setError('Match ID is required')
      return
    }
    if (!formData.when_ts) {
      setError('Interview date and time is required')
      return
    }

    const matchId = parseInt(formData.match_id)
    if (isNaN(matchId) || matchId <= 0) {
      setError('Invalid match ID')
      return
    }

    // Check if date is in the future
    const interviewDate = new Date(formData.when_ts)
    if (interviewDate <= new Date()) {
      setError('Interview must be scheduled for a future date and time')
      return
    }

    setLoading(true)
    try {
      const interview = await api.createInterview({
        match_id: matchId,
        when_ts: new Date(formData.when_ts).toISOString(),
        contact: formData.contact.trim() || null,
        notes: formData.notes.trim() || null,
      })

      // Redirect to interviews list
      router.push('/interviews')
    } catch (err) {
      console.error('Failed to create interview:', err)
      setError((err as Error).message || 'Failed to schedule interview')
      setLoading(false)
    }
  }

  if (dataLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600">Loading form data...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[800px] mx-auto">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Interviews', href: '/interviews' },
        { label: 'Schedule New Interview' }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-32 font-bold text-gray-900">Schedule Interview (面談)</h1>
            <p className="text-14 text-gray-600">Arrange a meeting between buyer and seller to finalize the deal</p>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-red-800 font-semibold text-14">Validation Error</p>
              <p className="text-red-600 text-14">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Info Box */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-indigo-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-indigo-900 font-semibold mb-1">About Interviews (面談)</p>
            <p className="text-indigo-800 text-14">
              After the auction clearing, interviews allow buyers and sellers to meet, discuss contract terms,
              verify plant specifications, and finalize delivery details before signing the contract.
              This is a crucial step in the RE trading process.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Match ID */}
          <div>
            <label htmlFor="match_id" className="block text-14 font-semibold text-gray-900 mb-2">
              Match ID *
            </label>
            <p className="text-13 text-gray-600 mb-3">
              The match ID from the cleared auction (lot-bid pairing)
            </p>
            <input
              id="match_id"
              type="number"
              min="1"
              value={formData.match_id}
              onChange={(e) => setFormData({ ...formData, match_id: e.target.value })}
              placeholder="e.g., 1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
              readOnly={!!searchParams.get('match_id')}
            />
            {searchParams.get('match_id') && (
              <p className="text-12 text-gray-500 mt-2">
                Match ID pre-filled from auction clearing results
              </p>
            )}
          </div>

          {/* Interview Date/Time */}
          <div>
            <label htmlFor="when_ts" className="block text-14 font-semibold text-gray-900 mb-2">
              Interview Date & Time (JST) *
            </label>
            <p className="text-13 text-gray-600 mb-3">
              When will the interview take place? Must be a future date.
            </p>
            <input
              id="when_ts"
              type="datetime-local"
              value={formData.when_ts}
              onChange={(e) => setFormData({ ...formData, when_ts: e.target.value })}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              required
            />
          </div>

          {/* Contact Info */}
          <div>
            <label htmlFor="contact" className="block text-14 font-semibold text-gray-900 mb-2">
              Contact Information
            </label>
            <p className="text-13 text-gray-600 mb-3">
              Email or phone number for coordination (optional)
            </p>
            <input
              id="contact"
              type="text"
              value={formData.contact}
              onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
              placeholder="e.g., meeting@example.com or +81-3-1234-5678"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          {/* Notes */}
          <div>
            <label htmlFor="notes" className="block text-14 font-semibold text-gray-900 mb-2">
              Notes
            </label>
            <p className="text-13 text-gray-600 mb-3">
              Additional information, agenda, or meeting location (optional)
            </p>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="e.g., Conference Room A, Tokyo Office&#10;Agenda: Review plant specifications and delivery schedule"
              rows={4}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Info Box */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-green-900 font-semibold text-14 mb-1">Next Steps</p>
                <p className="text-green-800 text-13">
                  After scheduling, both parties will be notified. The interview can be marked as completed
                  or cancelled later. Successful interviews typically lead to contract creation.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-8 pt-6 border-t border-gray-100">
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-14"
          >
            {loading ? 'Scheduling Interview...' : 'Schedule Interview'}
          </button>
          <Link
            href="/interviews"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors text-14"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
