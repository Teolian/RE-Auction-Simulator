const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

// Market stats
export async function getMarketStats() {
  const response = await fetch(`${API_BASE}/api/stats/market`)
  if (!response.ok) throw new Error('Failed to fetch market stats')
  return response.json()
}

// Auctions with counts
export async function getAuctionsWithCounts(filters?: {
  status?: string
  area?: string
}) {
  const params = new URLSearchParams({ with_counts: 'true' })
  if (filters?.status) params.set('status', filters.status)
  if (filters?.area) params.set('area', filters.area)

  const response = await fetch(`${API_BASE}/api/auctions?${params}`)
  if (!response.ok) throw new Error('Failed to fetch auctions')
  return response.json()
}

// My lots
export async function getMyLots(orgId: number, status?: string) {
  const params = new URLSearchParams({ org_id: orgId.toString() })
  if (status) params.set('status', status)

  const response = await fetch(`${API_BASE}/api/my/lots?${params}`)
  if (!response.ok) throw new Error('Failed to fetch my lots')
  return response.json()
}

// My bids
export async function getMyBids(orgId: number, status?: string) {
  const params = new URLSearchParams({ org_id: orgId.toString() })
  if (status) params.set('status', status)

  const response = await fetch(`${API_BASE}/api/my/bids?${params}`)
  if (!response.ok) throw new Error('Failed to fetch my bids')
  return response.json()
}
