'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function CreateAuction() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    mode: 'uniform_price' as 'uniform_price' | 'pay_as_bid',
    area: '',
    startsAt: '',
    endsAt: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.area.trim()) {
      setError('Area is required')
      return
    }
    if (!formData.startsAt || !formData.endsAt) {
      setError('Both start and end times are required')
      return
    }
    if (new Date(formData.endsAt) <= new Date(formData.startsAt)) {
      setError('End time must be after start time')
      return
    }

    setLoading(true)
    try {
      const auction = await api.createAuction({
        mode: formData.mode,
        area: formData.area.trim(),
        starts_at: new Date(formData.startsAt).toISOString(),
        ends_at: new Date(formData.endsAt).toISOString(),
      })

      // Redirect to the auction detail page
      router.push(`/auctions/${auction.auction_id}`)
    } catch (err) {
      console.error('Failed to create auction:', err)
      setError((err as Error).message || 'Failed to create auction')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-[800px] mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-14 text-primary hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <div>
            <h1 className="text-32 font-bold text-gray-900">Create New Auction</h1>
            <p className="text-14 text-gray-600">Set up a new auction for renewable energy trading</p>
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

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Mode Selection */}
          <div>
            <label className="block text-14 font-semibold text-gray-900 mb-2">
              Clearing Mode *
            </label>
            <p className="text-13 text-gray-600 mb-3">
              Select the pricing mechanism for this auction
            </p>
            <div className="grid grid-cols-2 gap-4">
              <label
                className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.mode === 'uniform_price'
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="uniform_price"
                  checked={formData.mode === 'uniform_price'}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.mode === 'uniform_price'
                        ? 'border-primary bg-primary'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {formData.mode === 'uniform_price' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 text-14">Uniform Price</span>
                </div>
                <p className="text-12 text-gray-600 ml-7">
                  All winners pay the same market clearing price
                </p>
              </label>

              <label
                className={`relative flex flex-col p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  formData.mode === 'pay_as_bid'
                    ? 'border-primary bg-blue-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="mode"
                  value="pay_as_bid"
                  checked={formData.mode === 'pay_as_bid'}
                  onChange={(e) => setFormData({ ...formData, mode: e.target.value as any })}
                  className="sr-only"
                />
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      formData.mode === 'pay_as_bid'
                        ? 'border-primary bg-primary'
                        : 'border-gray-300 bg-white'
                    }`}
                  >
                    {formData.mode === 'pay_as_bid' && (
                      <div className="w-2 h-2 bg-white rounded-full" />
                    )}
                  </div>
                  <span className="font-semibold text-gray-900 text-14">Pay as Bid</span>
                </div>
                <p className="text-12 text-gray-600 ml-7">
                  Each winner pays their individual bid price
                </p>
              </label>
            </div>
          </div>

          {/* Area Input */}
          <div>
            <label htmlFor="area" className="block text-14 font-semibold text-gray-900 mb-2">
              Area / Region *
            </label>
            <p className="text-13 text-gray-600 mb-3">
              Specify the geographic area for this auction (e.g., Kanto, Kansai, Hokkaido)
            </p>
            <input
              id="area"
              type="text"
              value={formData.area}
              onChange={(e) => setFormData({ ...formData, area: e.target.value })}
              placeholder="e.g., Kanto"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            />
          </div>

          {/* Date Time Inputs */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="startsAt" className="block text-14 font-semibold text-gray-900 mb-2">
                Start Time (JST) *
              </label>
              <p className="text-13 text-gray-600 mb-3">
                When the bidding window opens
              </p>
              <input
                id="startsAt"
                type="datetime-local"
                value={formData.startsAt}
                onChange={(e) => setFormData({ ...formData, startsAt: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>

            <div>
              <label htmlFor="endsAt" className="block text-14 font-semibold text-gray-900 mb-2">
                End Time (JST) *
              </label>
              <p className="text-13 text-gray-600 mb-3">
                When the bidding window closes
              </p>
              <input
                id="endsAt"
                type="datetime-local"
                value={formData.endsAt}
                onChange={(e) => setFormData({ ...formData, endsAt: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                required
              />
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="text-blue-900 font-semibold text-14 mb-1">Next Steps</p>
                <p className="text-blue-800 text-13">
                  After creating the auction, you can add lots (supply offers) from registered plants.
                  The auction will start in "draft" status and can be opened when ready.
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
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-14"
          >
            {loading ? 'Creating Auction...' : 'Create Auction'}
          </button>
          <Link
            href="/"
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors text-14"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}
