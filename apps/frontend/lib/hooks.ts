'use client'

import { useState, useEffect } from 'react'
import { getMarketStats, getAuctionsWithCounts, getMyLots, getMyBids } from './api-client'

export function useMarketStats() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const stats = await getMarketStats()
        if (mounted) {
          setData(stats)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [])

  return { data, loading, error }
}

export function useAuctionsWithCounts(filters?: { status?: string; area?: string }) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const auctions = await getAuctionsWithCounts(filters)
        if (mounted) {
          setData(auctions)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [filters?.status, filters?.area])

  return { data, loading, error }
}

export function useMyLots(orgId: number | null, status?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }

    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const lots = await getMyLots(orgId!, status)
        if (mounted) {
          setData(lots)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [orgId, status])

  return { data, loading, error }
}

export function useMyBids(orgId: number | null, status?: string) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!orgId) {
      setLoading(false)
      return
    }

    let mounted = true

    async function load() {
      try {
        setLoading(true)
        const bids = await getMyBids(orgId!, status)
        if (mounted) {
          setData(bids)
          setError(null)
        }
      } catch (err) {
        if (mounted) {
          setError(err as Error)
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    load()

    return () => {
      mounted = false
    }
  }, [orgId, status])

  return { data, loading, error }
}
