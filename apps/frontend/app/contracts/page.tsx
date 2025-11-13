'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { api, Contract } from '@/lib/api'
import { formatInTimeZone } from 'date-fns-tz'
import Breadcrumbs from '@/components/Breadcrumbs'

const TOKYO_TZ = 'Asia/Tokyo'

type StatusFilter = 'all' | 'draft' | 'pending' | 'signed' | 'cancelled'

export default function ContractsList() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [signing, setSigning] = useState<number | null>(null)

  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      const data = await api.getContracts()
      setContracts(data)
      setError(null)
    } catch (error) {
      console.error('Failed to load contracts:', error)
      setError('Failed to connect to API. Please check if the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async (contractId: number) => {
    if (!confirm('Sign this contract?\n\nThis will mark the contract as signed and both parties will be bound by its terms.')) {
      return
    }

    setSigning(contractId)
    try {
      await api.signContract(contractId)
      await loadContracts()
      alert('Contract signed successfully!')
    } catch (error) {
      console.error('Failed to sign contract:', error)
      alert('Failed to sign contract: ' + (error as Error).message)
    } finally {
      setSigning(null)
    }
  }

  const formatDateTime = (date: string) => {
    return formatInTimeZone(new Date(date), TOKYO_TZ, "yyyy-MM-dd HH:mm 'JST'")
  }

  const getStatusBadge = (status: string) => {
    const colors = {
      draft: 'bg-gray-50 text-gray-700 border-gray-200',
      pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
      signed: 'bg-green-50 text-green-700 border-green-200',
      cancelled: 'bg-red-50 text-red-700 border-red-200',
    }
    return colors[status as keyof typeof colors] || colors.draft
  }

  // Calculate statistics
  const stats = {
    total: contracts.length,
    draft: contracts.filter(c => c.status === 'draft').length,
    pending: contracts.filter(c => c.status === 'pending').length,
    signed: contracts.filter(c => c.status === 'signed').length,
    cancelled: contracts.filter(c => c.status === 'cancelled').length,
  }

  // Filter contracts
  const filteredContracts = statusFilter === 'all'
    ? contracts
    : contracts.filter(c => c.status === statusFilter)

  // Sort by creation date (newest first)
  const sortedContracts = [...filteredContracts].sort((a, b) => {
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="text-center">
          <div className="text-16 text-gray-600">Loading contracts...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-[1200px] mx-auto">
      <Breadcrumbs items={[
        { label: 'Dashboard', href: '/' },
        { label: 'Contracts' }
      ]} />

      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h1 className="text-32 font-bold text-gray-900 mb-2">Contracts</h1>
            <p className="text-16 text-gray-600">
              Legal agreements between buyers and sellers for renewable energy delivery
            </p>
          </div>
          <Link
            href="/contracts/create"
            className="px-5 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium transition-colors text-14 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Create New Contract
          </Link>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-5 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Total</div>
            <div className="text-28 font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Draft</div>
            <div className="text-28 font-bold text-gray-600">{stats.draft}</div>
          </div>
          <div className="bg-white rounded-lg border border-yellow-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Pending</div>
            <div className="text-28 font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg border border-green-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Signed</div>
            <div className="text-28 font-bold text-green-600">{stats.signed}</div>
          </div>
          <div className="bg-white rounded-lg border border-red-200 p-4">
            <div className="text-12 text-gray-500 mb-1 uppercase tracking-wide">Cancelled</div>
            <div className="text-28 font-bold text-red-600">{stats.cancelled}</div>
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="flex-1">
              <p className="text-red-800 font-semibold mb-1">Connection Error</p>
              <p className="text-red-600 text-14 mb-3">{error}</p>
              <button
                onClick={loadContracts}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium text-14 transition-colors"
              >
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contracts Section */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-100">
          <div className="flex justify-between items-center">
            <h2 className="text-20 font-semibold">All Contracts</h2>

            {/* Status Filter Tabs */}
            <div className="flex gap-2">
              {(['all', 'draft', 'pending', 'signed', 'cancelled'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status)}
                  className={`px-4 py-2 rounded-lg text-14 font-medium transition-colors ${
                    statusFilter === status
                      ? 'bg-teal-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {status === 'all' ? `All (${stats.total})` : `${status.charAt(0).toUpperCase() + status.slice(1)}`}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-6">
          {sortedContracts.length === 0 ? (
            <div className="text-center py-12">
              <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-gray-500 font-medium mb-2">
                {error ? 'No connection to backend' : 'No contracts found'}
              </p>
              <p className="text-14 text-gray-400 mb-4">
                {error
                  ? 'Please ensure the API server is running'
                  : statusFilter === 'all'
                    ? 'Create your first contract after a successful interview'
                    : `No contracts with status "${statusFilter}"`
                }
              </p>
              {!error && statusFilter === 'all' && (
                <Link
                  href="/interviews"
                  className="inline-block px-5 py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-14"
                >
                  Go to Interviews
                </Link>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedContracts.map((contract) => {
                const canSign = contract.status === 'draft' || contract.status === 'pending'
                const isSigning = signing === contract.contract_id

                return (
                  <div
                    key={contract.contract_id}
                    className="border border-gray-200 rounded-lg p-5 hover:border-teal-300 hover:shadow-sm transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-16 font-semibold text-gray-900">
                            Contract #{contract.contract_id}
                          </h3>
                          <span className={`px-3 py-1 rounded-lg border text-12 font-medium ${getStatusBadge(contract.status)}`}>
                            {contract.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-3 gap-6 text-14 mb-3">
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Match ID</div>
                            <div className="font-mono text-gray-900">#{contract.match_id}</div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Created</div>
                            <div className="font-medium text-gray-900">
                              {formatDateTime(contract.created_at)}
                            </div>
                          </div>
                          <div>
                            <div className="text-gray-500 text-12 mb-1">Draft Document</div>
                            {contract.draft_url ? (
                              <a
                                href={contract.draft_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-teal-600 hover:text-teal-700 hover:underline text-13 flex items-center gap-1"
                              >
                                View Document
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                              </a>
                            ) : (
                              <span className="text-gray-400 text-13">—</span>
                            )}
                          </div>
                        </div>

                        {/* Info banner for draft/pending contracts */}
                        {canSign && (
                          <div className="mt-3 p-3 bg-teal-50 rounded-lg border border-teal-200">
                            <p className="text-13 text-teal-800">
                              This contract is ready for signing. Both parties should review the terms before signing.
                            </p>
                          </div>
                        )}

                        {/* Success banner for signed contracts */}
                        {contract.status === 'signed' && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                              </svg>
                              <p className="text-13 text-green-800 font-medium">
                                Contract signed successfully
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {canSign && (
                          <button
                            onClick={() => handleSign(contract.contract_id)}
                            disabled={isSigning}
                            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-medium text-14 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {isSigning ? 'Signing...' : 'Sign Contract'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Back to Dashboard */}
      <div className="mt-6">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-14 text-gray-600 hover:text-primary"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </Link>
      </div>
    </div>
  )
}
