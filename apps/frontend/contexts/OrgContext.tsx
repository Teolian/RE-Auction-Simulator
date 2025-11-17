'use client'

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

export interface Org {
  org_id: number
  name: string
  type: 'seller' | 'buyer' | 'operator'
  created_at: string
}

interface OrgContextType {
  org: Org | null
  setOrg: (org: Org | null) => void
  isLoading: boolean
}

const OrgContext = createContext<OrgContextType | undefined>(undefined)

const ORG_STORAGE_KEY = 're-auction-selected-org'

export function OrgProvider({ children }: { children: ReactNode }) {
  const [org, setOrgState] = useState<Org | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(ORG_STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setOrgState(parsed)
      } catch (e) {
        console.error('Failed to parse stored org:', e)
      }
    }
    setIsLoading(false)
  }, [])

  // Persist to localStorage when changed
  const setOrg = (newOrg: Org | null) => {
    setOrgState(newOrg)
    if (newOrg) {
      localStorage.setItem(ORG_STORAGE_KEY, JSON.stringify(newOrg))
    } else {
      localStorage.removeItem(ORG_STORAGE_KEY)
    }
  }

  return (
    <OrgContext.Provider value={{ org, setOrg, isLoading }}>
      {children}
    </OrgContext.Provider>
  )
}

export function useOrg() {
  const context = useContext(OrgContext)
  if (context === undefined) {
    throw new Error('useOrg must be used within an OrgProvider')
  }
  return context
}
