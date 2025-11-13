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

export interface Plant {
  plant_id: number
  org_id: number
  type: 'pv' | 'wind'
  prefecture: string | null
  ac_mw: number
  profile_json: any
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

export interface Interview {
  iv_id: number
  match_id: number
  status: 'scheduled' | 'completed' | 'cancelled'
  when_ts: string
  contact: string | null
  notes: string | null
  created_at: string
}

export interface Contract {
  contract_id: number
  match_id: number
  draft_url: string | null
  status: 'draft' | 'pending' | 'signed' | 'cancelled'
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

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`)
  }
  const contentType = res.headers.get('content-type')
  if (!contentType || !contentType.includes('application/json')) {
    throw new Error('API returned non-JSON response')
  }
  return res.json()
}

export const api = {
  // Auctions
  getAuctions: async (): Promise<Auction[]> => {
    try {
      const res = await fetch(`${API_BASE}/api/auctions`, { cache: 'no-store' })
      return await handleResponse(res)
    } catch (error) {
      console.error('Failed to fetch auctions:', error)
      return []
    }
  },

  getAuction: async (id: number): Promise<Auction> => {
    const res = await fetch(`${API_BASE}/api/auctions/${id}`, { cache: 'no-store' })
    return await handleResponse(res)
  },

  createAuction: async (data: Partial<Auction>): Promise<Auction> => {
    const res = await fetch(`${API_BASE}/api/auctions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await handleResponse(res)
  },

  openAuction: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/auctions/${id}/open`, {
      method: 'POST',
    })
    return await handleResponse(res)
  },

  lockAuction: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/auctions/${id}/lock`, {
      method: 'POST',
    })
    return await handleResponse(res)
  },

  clearAuction: async (id: number): Promise<ClearingResult> => {
    const res = await fetch(`${API_BASE}/api/auctions/${id}/clear`, {
      method: 'POST',
    })
    return await handleResponse(res)
  },

  getReport: async (id: number): Promise<Report> => {
    const res = await fetch(`${API_BASE}/api/auctions/${id}/report`, { cache: 'no-store' })
    return await handleResponse(res)
  },

  // Plants
  getPlants: async (orgId?: number): Promise<Plant[]> => {
    try {
      const url = orgId
        ? `${API_BASE}/api/plants?org_id=${orgId}`
        : `${API_BASE}/api/plants`
      const res = await fetch(url, { cache: 'no-store' })
      return await handleResponse(res)
    } catch (error) {
      console.error('Failed to fetch plants:', error)
      return []
    }
  },

  // Lots
  getLots: async (auctionId?: number): Promise<Lot[]> => {
    try {
      const url = auctionId
        ? `${API_BASE}/api/lots?auction_id=${auctionId}`
        : `${API_BASE}/api/lots`
      const res = await fetch(url, { cache: 'no-store' })
      return await handleResponse(res)
    } catch (error) {
      console.error('Failed to fetch lots:', error)
      return []
    }
  },

  createLot: async (data: Partial<Lot>): Promise<Lot> => {
    const res = await fetch(`${API_BASE}/api/lots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await handleResponse(res)
  },

  // Bids
  getBids: async (auctionId?: number, orgId?: number): Promise<Bid[]> => {
    try {
      const params = new URLSearchParams()
      if (auctionId) params.append('auction_id', auctionId.toString())
      if (orgId) params.append('org_id', orgId.toString())
      const res = await fetch(`${API_BASE}/api/bids?${params}`, { cache: 'no-store' })
      return await handleResponse(res)
    } catch (error) {
      console.error('Failed to fetch bids:', error)
      return []
    }
  },

  submitBid: async (data: Partial<Bid>): Promise<Bid> => {
    const res = await fetch(`${API_BASE}/api/bids`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await handleResponse(res)
  },

  // Interviews
  getInterviews: async (matchId?: number): Promise<Interview[]> => {
    try {
      const url = matchId
        ? `${API_BASE}/api/interviews?match_id=${matchId}`
        : `${API_BASE}/api/interviews`
      const res = await fetch(url, { cache: 'no-store' })
      return await handleResponse(res)
    } catch (error) {
      console.error('Failed to fetch interviews:', error)
      return []
    }
  },

  createInterview: async (data: Partial<Interview>): Promise<Interview> => {
    const res = await fetch(`${API_BASE}/api/interviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await handleResponse(res)
  },

  // Contracts
  getContracts: async (matchId?: number, status?: string): Promise<Contract[]> => {
    try {
      const params = new URLSearchParams()
      if (matchId) params.append('match_id', matchId.toString())
      if (status) params.append('status', status)
      const url = params.toString()
        ? `${API_BASE}/api/contracts?${params}`
        : `${API_BASE}/api/contracts`
      const res = await fetch(url, { cache: 'no-store' })
      return await handleResponse(res)
    } catch (error) {
      console.error('Failed to fetch contracts:', error)
      return []
    }
  },

  createContract: async (data: Partial<Contract>): Promise<Contract> => {
    const res = await fetch(`${API_BASE}/api/contracts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return await handleResponse(res)
  },

  signContract: async (id: number) => {
    const res = await fetch(`${API_BASE}/api/contracts/${id}/sign`, {
      method: 'POST',
    })
    return await handleResponse(res)
  },

  // Health
  healthCheck: async () => {
    const res = await fetch(`${API_BASE}/healthz`)
    return await handleResponse(res)
  },
}
