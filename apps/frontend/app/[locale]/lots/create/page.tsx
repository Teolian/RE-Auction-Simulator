'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { api, Auction, Plant } from '@/lib/api'

export default function CreateLot() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [dataLoading, setDataLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [auctions, setAuctions] = useState<Auction[]>([])
  const [plants, setPlants] = useState<Plant[]>([])

  const [formData, setFormData] = useState({
    auction_id: searchParams.get('auction_id') || '',
    plant_id: '',
    min_vol_mwh: '',
    max_vol_mwh: '',
    reserve_price: '',
    step_mwh: '0.1',
    allow_partial: true,
  })

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [auctionsData, plantsData] = await Promise.all([
        api.getAuctions(),
        api.getPlants(),
      ])

      // Filter auctions to only draft/open status
      setAuctions(auctionsData.filter(a => a.status === 'draft' || a.status === 'open'))
      setPlants(plantsData)
    } catch (err) {
      console.error('Failed to load data:', err)
      setError('Failed to load auctions and plants')
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
    if (!formData.plant_id) {
      setError('Please select a plant')
      return
    }

    const minVol = parseFloat(formData.min_vol_mwh)
    const maxVol = parseFloat(formData.max_vol_mwh)
    const reservePrice = parseFloat(formData.reserve_price)
    const stepMwh = parseFloat(formData.step_mwh)

    if (isNaN(minVol) || minVol <= 0) {
      setError('Min volume must be greater than 0')
      return
    }
    if (isNaN(maxVol) || maxVol <= 0) {
      setError('Max volume must be greater than 0')
      return
    }
    if (minVol > maxVol) {
      setError('Min volume cannot exceed max volume')
      return
    }
    if (isNaN(reservePrice) || reservePrice <= 0) {
      setError('Reserve price must be greater than 0')
      return
    }
    if (isNaN(stepMwh) || stepMwh <= 0) {
      setError('Step size must be greater than 0')
      return
    }

    setLoading(true)
    try {
      const lot = await api.createLot({
        auction_id: parseInt(formData.auction_id),
        plant_id: parseInt(formData.plant_id),
        min_vol_mwh: minVol,
        max_vol_mwh: maxVol,
        reserve_price: reservePrice,
        step_mwh: stepMwh,
        allow_partial: formData.allow_partial,
      })

      // Redirect to the auction detail page
      router.push(`/auctions/${formData.auction_id}`)
    } catch (err) {
      console.error('Failed to create lot:', err)
      setError((err as Error).message || 'Failed to create lot')
      setLoading(false)
    }
  }

  const selectedPlant = plants.find(p => p.plant_id === parseInt(formData.plant_id))

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
    <div className="max-w-[900px] mx-auto">
      {/* Breadcrumb */}
      <div className="mb-6">
        <Link href="/" className="text-14 text-primary hover:underline">
          ← Back to Dashboard
        </Link>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-32 font-bold text-gray-900">Create Lot</h1>
            <p className="text-14 text-gray-600">Offer energy from your power plant to an auction</p>
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

      {/* No Data Messages */}
      {auctions.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-900 font-semibold mb-1">No Available Auctions</p>
              <p className="text-yellow-800 text-14">
                There are no draft or open auctions. An operator must create an auction first.
              </p>
              <Link href="/" className="inline-block mt-3 text-14 text-yellow-900 underline hover:no-underline">
                Go to Dashboard
              </Link>
            </div>
          </div>
        </div>
      )}

      {plants.length === 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-yellow-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div>
              <p className="text-yellow-900 font-semibold mb-1">No Plants Registered</p>
              <p className="text-yellow-800 text-14">
                You need to register at least one power plant before creating lots. Run the seed script to add sample plants.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      {auctions.length > 0 && plants.length > 0 && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="space-y-6">
            {/* Auction Selection */}
            <div>
              <label htmlFor="auction_id" className="block text-14 font-semibold text-gray-900 mb-2">
                Select Auction *
              </label>
              <p className="text-13 text-gray-600 mb-3">
                Choose an auction that is currently accepting lots (draft or open status)
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
                    #{auction.auction_id} - {auction.area} ({auction.mode.replace('_', ' ').toUpperCase()}) - {auction.status.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Plant Selection */}
            <div>
              <label htmlFor="plant_id" className="block text-14 font-semibold text-gray-900 mb-2">
                Select Power Plant *
              </label>
              <p className="text-13 text-gray-600 mb-3">
                Choose which plant will supply the energy for this lot
              </p>
              <select
                id="plant_id"
                value={formData.plant_id}
                onChange={(e) => setFormData({ ...formData, plant_id: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white"
                required
              >
                <option value="">-- Select Plant --</option>
                {plants.map((plant) => (
                  <option key={plant.plant_id} value={plant.plant_id}>
                    #{plant.plant_id} - {plant.type.toUpperCase()} - {plant.ac_mw} MW
                    {plant.prefecture && ` (${plant.prefecture})`}
                  </option>
                ))}
              </select>

              {selectedPlant && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="text-12 text-gray-600 mb-1">Plant Details</div>
                  <div className="grid grid-cols-3 gap-4 text-14">
                    <div>
                      <span className="text-gray-500">Type:</span>{' '}
                      <span className="font-medium">{selectedPlant.type === 'pv' ? 'Solar PV' : 'Wind'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Capacity:</span>{' '}
                      <span className="font-medium">{selectedPlant.ac_mw} MW</span>
                    </div>
                    {selectedPlant.prefecture && (
                      <div>
                        <span className="text-gray-500">Location:</span>{' '}
                        <span className="font-medium">{selectedPlant.prefecture}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Volume Range */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="min_vol_mwh" className="block text-14 font-semibold text-gray-900 mb-2">
                  Min Volume (MWh) *
                </label>
                <p className="text-13 text-gray-600 mb-3">
                  Minimum acceptable volume
                </p>
                <input
                  id="min_vol_mwh"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.min_vol_mwh}
                  onChange={(e) => setFormData({ ...formData, min_vol_mwh: e.target.value })}
                  placeholder="e.g., 10.0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="max_vol_mwh" className="block text-14 font-semibold text-gray-900 mb-2">
                  Max Volume (MWh) *
                </label>
                <p className="text-13 text-gray-600 mb-3">
                  Maximum available volume
                </p>
                <input
                  id="max_vol_mwh"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={formData.max_vol_mwh}
                  onChange={(e) => setFormData({ ...formData, max_vol_mwh: e.target.value })}
                  placeholder="e.g., 50.0"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>
            </div>

            {/* Reserve Price and Step */}
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="reserve_price" className="block text-14 font-semibold text-gray-900 mb-2">
                  Reserve Price (¥/kWh) *
                </label>
                <p className="text-13 text-gray-600 mb-3">
                  Minimum price you'll accept
                </p>
                <input
                  id="reserve_price"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.reserve_price}
                  onChange={(e) => setFormData({ ...formData, reserve_price: e.target.value })}
                  placeholder="e.g., 8.50"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-14 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="step_mwh" className="block text-14 font-semibold text-gray-900 mb-2">
                  Step Size (MWh) *
                </label>
                <p className="text-13 text-gray-600 mb-3">
                  Volume increment granularity
                </p>
                <input
                  id="step_mwh"
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.step_mwh}
                  onChange={(e) => setFormData({ ...formData, step_mwh: e.target.value })}
                  placeholder="e.g., 0.1"
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
                  <div className="text-14 font-semibold text-gray-900">Allow Partial Fill</div>
                  <p className="text-13 text-gray-600 mt-1">
                    If enabled, this lot can be partially matched with bids. If disabled, the lot must be fully matched or not matched at all.
                  </p>
                </div>
              </label>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="text-blue-900 font-semibold text-14 mb-1">Lot Matching</p>
                  <p className="text-blue-800 text-13">
                    After the auction closes and clearing runs, your lot will be matched with buyer bids.
                    The clearing price depends on the auction mode (uniform price or pay-as-bid).
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
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-14"
            >
              {loading ? 'Creating Lot...' : 'Create Lot'}
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
