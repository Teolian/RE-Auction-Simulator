'use client'

import { useOrg } from '@/contexts/OrgContext'
import { useRole } from '@/contexts/RoleContext'
import OperatorDashboard from '@/components/dashboards/OperatorDashboard'
import SellerDashboard from '@/components/dashboards/SellerDashboard'
import BuyerDashboard from '@/components/dashboards/BuyerDashboard'
import { useEffect } from 'react'

export default function Home() {
  const { org } = useOrg()
  const { role, setRole } = useRole()

  // Sync role with org type when org changes
  useEffect(() => {
    if (org && org.type !== role) {
      setRole(org.type)
    }
  }, [org, role, setRole])

  // Use org type to determine dashboard
  const currentRole = org?.type || role

  // Render role-specific dashboard
  if (currentRole === 'operator') {
    return <OperatorDashboard />
  }

  if (currentRole === 'seller') {
    return <SellerDashboard />
  }

  if (currentRole === 'buyer') {
    return <BuyerDashboard />
  }

  return null
}
