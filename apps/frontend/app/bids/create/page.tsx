'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api, Auction } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'

const TOKYO_TZ = 'Asia/Tokyo'

export default function CreateBid() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [auctions, setAuctions] = useState<Auction[]>([])

  const [formData, setFormData] = useState({
    auction_id: searchParams.get('auction_id') || '',
    org_id: '2', // Default to buyer org (in real app, this comes from auth)
    price_yen_kwh: '',
    volume_mwh: '',
    allow_partial: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const auctionsData = await api.getAuctions()

      // Filter auctions to only open status
      setAuctions(auctionsData.filter(a => a.status === 'open'))
    } catch (err) {
      console.error('Failed to load auctions:', err)
      setError('Failed to load auctions')
    } finally {
      setDataLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.auction_id) {
      setError('Please select an auction')
      return
    }

    const price = parseFloat(formData.price_yen_kwh)
    const volume = parseFloat(formData.volume_mwh)
    const orgId = parseInt(formData.org_id)

    if (isNaN(orgId) || orgId <= 0) {
      setError('Invalid organization ID')
      return
    }
    if (isNaN(price) || price <= 0) {
      setError('Price must be greater than 0')
      return
    }
    if (isNaN(volume) || volume <= 0) {
      setError('Volume must be greater than 0')
      return
    }

    setLoading(true)
    try {
      const bid = await api.submitBid({
        auction_id: parseInt(formData.auction_id),
        org_id: orgId,
        price_yen_kwh: price,
        volume_mwh: volume,
        allow_partial: formData.allow_partial,
      })

      // Redirect to the auction detail page
      router.push(`/auctions/${formData.auction_id}`)
    } catch (err) {
      console.error('Failed to submit bid:', err)
      setError((err as Error).message || 'Failed to submit bid')
      setLoading(false)
    }
  }

  const selectedAuction = auctions.find(a => a.auction_id === parseInt(formData.auction_id))

  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, 'yyyy-MM-dd HH:mm') + ' JST'
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
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-14 text-primary hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-32 font-bold text-gray-900">Submit Bid</h1>
            <p className="text-14 text-gray-600">Place a sealed bid on an open auction</p>
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

      {/* No Data Message */}
      {auctions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-900 font-semibold mb-1">No Open Auctions</p>
              <p className="text-yellow-800 text-14">
                There are currently no open auctions accepting bids. Please check back later or contact an operator.
              </p>
              <Link href="/" className="inline-block mt-3 text-14 text-yellow-900 underline hover:no-underline">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Sealed Bid Warning */}
      {auctions.length > 0 && (
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-purple-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <div>
              <p className="text-purple-900 font-semibold mb-1">Sealed Bid Auction</p>
              <p className="text-purple-800 text-14">
                Your bid is confidential and will not be visible to other participants until after the auction is cleared.
                Bid strategically based on your valuation of the energy.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {auctions.length > 0 && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Auction Selection */}
            <div>
              <label htmlFor="auction_id" className="block text-14 font-semibold text-gray-900 mb-2">
                Select Auction *
              </label>
              <p className="text-13 text-gray-600 mb-3">
                Choose an open auction to bid on
              </p>
              <select
                id="auction_id"
                value={formData.auction_id}
                onChange={(e) => setFormData({ ...formData, auction_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                required
              >
                <option value="">-- Select Auction --</option>
                {auctions.map((auction) => (
                  <option key={auction.auction_id} value={auction.auction_id}>
                    #{auction.auction_id} - {auction.area} ({auction.mode.replace('_', ' ').toUpperCase()})
                  </option>
                ))}
              </select>

              {selectedAuction && (
                <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <div className="text-12 text-gray-600 mb-2 uppercase tracking-wide">Auction Details</div>
                  <div className="grid grid-cols-2 gap-4 text-14">
                    <div>
                      <span className="text-gray-600">Mode:</span>{' '}
                      <span className="font-semibold text-gray-900">
                        {selectedAuction.mode === 'uniform_price' ? 'Uniform Price' : 'Pay as Bid'}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Area:</span>{' '}
                      <span className="font-semibold text-gray-900">{selectedAuction.area}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Opens:</span>{' '}
                      <span className="font-medium text-gray-900">{formatDateTime(selectedAuction.starts_at)}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Closes:</span>{' '}
                      <span className="font-medium text-gray-900">{formatDateTime(selectedAuction.ends_at)}</span>
                    </div>
                  </div>
                  {selectedAuction.mode === 'uniform_price' && (
                    <div className="mt-3 pt-3 border-t border-blue-200 text-13 text-blue-800">
                      <strong>Uniform Price:</strong> All winning bids pay the same market clearing price.
                      Bid your true maximum willingness to pay.
                    </div>
                  )}
                  {selectedAuction.mode === 'pay_as_bid' && (
                    <div className="mt-3 pt-3 border-t border-blue-200 text-13 text-blue-800">
                      <strong>Pay as Bid:</strong> Each winning bid pays its own bid price.
                      Consider bidding strategically below your maximum valuation.
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Organization ID (mock - in real app from auth) */}
            <div>
              <label htmlFor="org_id" className="block text-14 font-semibold text-gray-900 mb-2">
                Organization ID *
              </label>
              <p className="text-13 text-gray-600 mb-3">
                Your organization identifier (in production, this will be automatic)
              </p>
              <select
                id="org_id"
                value={formData.org_id}
                onChange={(e) => setFormData({ ...formData, org_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                required
              >
                <option value="2">Org #2 - Kansai Energy Trading (Buyer)</option>
                <option value="3">Org #3 - Hokkaido Power (Buyer)</option>
              </select>
            </div>

            {/* Price and Volume */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="price_yen_kwh" className="block text-14 font-semibold text-gray-900 mb-2">
                  Bid Price (¥/kWh) *
                </label>
                <p className="text-13 text-gray-600 mb-3">
                  Maximum price you're willing to pay
                </p>
                <input
                  id="price_yen_kwh"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.price_yen_kwh}
                  onChange={(e) => setFormData({ ...formData, price_yen_kwh: e.target.value })}
                  placeholder="e.g., 12.50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="volume_mwh" className="block text-14 font-semibold text-gray-900 mb-2">
                  Volume (MWh) *
                </label>
                <p className="text-13 text-gray-600 mb-3">
                  Amount of energy you want to purchase
                </p>
                <input
                  id="volume_mwh"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.volume_mwh}
                  onChange={(e) => setFormData({ ...formData, volume_mwh: e.target.value })}
                  placeholder="e.g., 25.0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Allow Partial */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.allow_partial}
                  onChange={(e) => setFormData({ ...formData, allow_partial: e.target.checked })}
                  className="mt-1 w-5 h-5 text-primary border-gray-300 rounded focus:ring-2 focus:ring-primary"
                />
                <div>
                  <div className="text-14 font-semibold text-gray-900">Accept Partial Fill</div>
                  <p className="text-13 text-gray-600 mt-1">
                    If enabled, your bid can be partially matched. If disabled, you'll only accept a full match of your requested volume.
                  </p>
                </div>
              </label>
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
                    After submission, your bid will remain sealed until the operator locks the auction and runs clearing.
                    You'll be notified of any matches and the final clearing price.
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
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-14"
            >
              {loading ? 'Submitting Bid...' : 'Submit Bid'}
            </button>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-semibold transition-colors text-14"
            >
              Cancel
            </Link>
          </div>
        </form>
      )}
    </div>
  )
}
