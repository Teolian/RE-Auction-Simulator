'use client'

import { useState, useEffect } from 'react'
import { useOrg, type Org } from '@/contexts/OrgContext'

export default function OrgSelector() {
  const { org, setOrg } = useOrg()
  const [orgs, setOrgs] = useState<Org[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadOrgs() {
      try {
        const response = await fetch('http://localhost:8000/api/orgs')
        if (response.ok) {
          const data = await response.json()
          setOrgs(data)
          // Auto-select first org if none selected
          if (!org && data.length > 0) {
            setOrg(data[0])
          }
        }
      } catch (error) {
        console.error('Failed to load organizations:', error)
      } finally {
        setLoading(false)
      }
    }
    loadOrgs()
  }, [])

  if (loading || !org) {
    return (
      <div className="px-3 py-2 bg-gray-100 rounded-lg text-14 text-gray-500 animate-pulse">
        Loading...
      </div>
    )
  }

  const getOrgBadgeColor = (type: string) => {
    switch (type) {
      case 'seller': return 'bg-green-100 text-green-700'
      case 'buyer': return 'bg-blue-100 text-blue-700'
      case 'operator': return 'bg-purple-100 text-purple-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-14 font-medium transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-gray-600">Organization:</span>
          <span className="text-gray-900">{org.name}</span>
          <span className={`px-2 py-0.5 rounded text-12 font-semibold uppercase ${getOrgBadgeColor(org.type)}`}>
            {org.type}
          </span>
        </div>
        <svg className={`w-4 h-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-20 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
              <div className="text-12 text-gray-500 font-semibold uppercase tracking-wide">Select Organization</div>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {orgs.map((o) => (
                <button
                  key={o.org_id}
                  onClick={() => {
                    setOrg(o)
                    setIsOpen(false)
                  }}
                  className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0 ${
                    org.org_id === o.org_id ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-14 text-gray-900">{o.name}</div>
                      <div className="text-12 text-gray-500 mt-0.5">ID: {o.org_id}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-12 font-semibold uppercase ${getOrgBadgeColor(o.type)}`}>
                      {o.type}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
