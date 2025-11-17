'use client'

import { useRole } from '@/contexts/RoleContext'
import OperatorDashboard from '@/components/dashboards/OperatorDashboard'
import SellerDashboard from '@/components/dashboards/SellerDashboard'
import BuyerDashboard from '@/components/dashboards/BuyerDashboard'

export default function Home() {
  const { role } = useRole()

  // Render role-specific dashboard
  if (role === 'operator') {
    return <OperatorDashboard />
  }

  if (role === 'seller') {
    return <SellerDashboard />
  }

  if (role === 'buyer') {
    return <BuyerDashboard />
  }

  return null
}
