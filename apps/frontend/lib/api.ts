const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8000'

export interface Auction {
  auction_id: number
  mode: 'uniform_price' | 'pay_as_bid'
  area: string
  starts_at: string
  ends_at: string
  status: 'draft' | 'open' | 'locked' | 'cleared' | 'published'
  cleared_price: number | null
  cleared_volume: number | null
  created_at: string
}

export interface Lot {
  lot_id: number
  auction_id: number
  plant_id: number
  min_vol_mwh: number
  max_vol_mwh: number
  reserve_price: number
  step_mwh: number
  allow_partial: boolean
  created_at: string
}

export interface Bid {
  bid_id: number
  auction_id: number
  org_id: number
  price_yen_kwh: number
  volume_mwh: number
  allow_partial: boolean
  terms_json: any
  created_at: string
}

export interface Match {
  match_id: number
  auction_id: number
  lot_id: number
  bid_id: number
  cleared_price: number
  cleared_volume: number
  notes: string | null
  created_at: string
}

export interface ClearingResult {
  auction_id: number
  cleared_price: number | null
  cleared_volume: number
  matches_count: number
  audit_trail: any[]
}

export interface Report {
  auction_id: number
  mode: string
  area: string
  cleared_price: number | null
  cleared_volume: number
  total_lots: number
  total_bids: number
  matches: Match[]
}

export const api = {
  // Auctions
  getAuctions: async (): Promise<Auction[]> => {
    const res = await fetch(`${API_BASE}/api/auctions`, { cache: 'no-store' })
    return res.json()
  },

  getAuction: async (id: number): Promise<Auction> => {
    const res = await fetch(`${API_BASE}/api/auctions/${id}`, { cache: 'no-store' })
    return res.json()
  },

  createAuction: async (data: Partial<Auction>): Promise<Auction> => {
    const res = await fetch(`${API_BASE}/api/auctions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  lockAuction: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/auctions/${id}/lock`, {
      method: 'POST',
    })
    return res.json()
  },

  clearAuction: async (id: number): Promise<ClearingResult> => {
    const res = await fetch(`${API_BASE}/api/auctions/${id}/clear`, {
      method: 'POST',
    })
    return res.json()
  },

  getReport: async (id: number): Promise<Report> => {
    const res = await fetch(`${API_BASE}/api/auctions/${id}/report`, { cache: 'no-store' })
    return res.json()
  },

  // Lots
  getLots: async (auctionId?: number): Promise<Lot[]> => {
    const url = auctionId
      ? `${API_BASE}/api/lots?auction_id=${auctionId}`
      : `${API_BASE}/api/lots`
    const res = await fetch(url, { cache: 'no-store' })
    return res.json()
  },

  createLot: async (data: Partial<Lot>): Promise<Lot> => {
    const res = await fetch(`${API_BASE}/api/lots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  // Bids
  getBids: async (auctionId?: number, orgId?: number): Promise<Bid[]> => {
    const params = new URLSearchParams()
    if (auctionId) params.append('auction_id', auctionId.toString())
    if (orgId) params.append('org_id', orgId.toString())
    const res = await fetch(`${API_BASE}/api/bids?${params}`, { cache: 'no-store' })
    return res.json()
  },

  submitBid: async (data: Partial<Bid>): Promise<Bid> => {
    const res = await fetch(`${API_BASE}/api/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return res.json()
  },

  // Health
  healthCheck: async () => {
    const res = await fetch(`${API_BASE}/healthz`)
    return res.json()
  },
}
