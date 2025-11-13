'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function CreateContract() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    match_id: searchParams.get('match_id') || '',
    draft_url: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.match_id) {
      setError('Match ID is required')
      return
    }

    const matchId = parseInt(formData.match_id)
    if (isNaN(matchId) || matchId <= 0) {
      setError('Invalid match ID')
      return
    }

    setLoading(true)
    try {
      const contract = await api.createContract({
        match_id: matchId,
        draft_url: formData.draft_url.trim() || null,
      })

      // Redirect to contracts list
      router.push('/contracts')
    } catch (err) {
      console.error('Failed to create contract:', err)
      setError((err as Error).message || 'Failed to create contract')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/contracts" className="text-14 text-primary hover:underline">
          ← Back to Contracts
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-teal-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-32 font-bold text-gray-900">Create Contract</h1>
            <p className="text-14 text-gray-600">Draft a contract for an auction match after successful interview</p>
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
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-6 mb-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-teal-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-teal-900 font-semibold mb-1">About Contracts</p>
            <p className="text-teal-800 text-14">
              After a successful interview, create a contract to formalize the agreement between buyer and seller.
              Contracts define delivery terms, payment conditions, and other legal details.
              Both parties must review and sign before execution.
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
              The match ID from the cleared auction (must have completed interview)
            </p>
            <input
              id="match_id"
              type="number"
              min="1"
              value={formData.match_id}
              onChange={(e) => setFormData({ ...formData, match_id: e.target.value })}
              placeholder="e.g., 1"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
              required
              readOnly={!!searchParams.get('match_id')}
            />
            {searchParams.get('match_id') && (
              <p className="text-12 text-gray-500 mt-2">
                Match ID pre-filled from interview
              </p>
            )}
          </div>

          {/* Draft URL */}
          <div>
            <label htmlFor="draft_url" className="block text-14 font-semibold text-gray-900 mb-2">
              Contract Draft URL
            </label>
            <p className="text-13 text-gray-600 mb-3">
              Link to the contract draft document (Google Docs, PDF, etc.) - Optional
            </p>
            <input
              id="draft_url"
              type="url"
              value={formData.draft_url}
              onChange={(e) => setFormData({ ...formData, draft_url: e.target.value })}
              placeholder="e.g., https://docs.google.com/document/d/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-900 font-semibold text-14 mb-1">Contract Workflow</p>
                <p className="text-blue-800 text-13">
                  1. Create contract (draft status)<br />
                  2. Both parties review terms<br />
                  3. Sign contract (changes status to signed)<br />
                  4. Execute delivery and payment
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
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-14"
          >
            {loading ? 'Creating Contract...' : 'Create Contract'}
          </button>
          <Link
            href="/contracts"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors text-14"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
