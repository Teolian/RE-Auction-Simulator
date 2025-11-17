'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useRole, roleConfig, UserRole } from '@/contexts/RoleContext'
import OrgSelector from './OrgSelector'

export default function Navigation() {
  const pathname = usePathname()
  const { role, setRole } = useRole()

  const navItems = [
    {
      name: 'Dashboard',
      href: '/',
      roles: ['operator', 'seller', 'buyer'] as UserRole[],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      name: 'Auctions',
      href: '/auctions',
      roles: ['operator', 'seller', 'buyer'] as UserRole[],
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
        </svg>
      ),
    },
  ]

  // Filter navigation items based on current role
  const filteredNavItems = navItems.filter(item => item.roles.includes(role))

  const isActive = (href: string) => {
    if (href === '/') {
      return pathname === '/'
    }
    return pathname.startsWith(href)
  }

  const currentRoleConfig = roleConfig[role]

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      {/* Role indicator bar */}
      <div className={`h-1 ${currentRoleConfig.activeBg}`} />

      <div className="max-w-[1400px] mx-auto px-6">
        <div className="flex items-center justify-between h-20">
          {/* Logo / Brand */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <div className="text-16 font-bold text-gray-900">RE Auction</div>
                <div className={`px-1.5 py-0.5 rounded text-9 font-semibold uppercase tracking-wide ${roleConfig[role].bgColor} ${roleConfig[role].textColor}`}>
                  {roleConfig[role].name}
                </div>
              </div>
              <div className="text-10 text-gray-500 uppercase tracking-wide">Trading Platform</div>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-0.5">
            {filteredNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-14 font-medium transition-colors ${
                  isActive(item.href)
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            ))}
          </div>

          {/* Org Selector & Role Switcher */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Org Selector */}
            <OrgSelector />

            {/* Role Switcher */}
            <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5">
              {(['seller', 'buyer', 'operator'] as UserRole[]).map((r) => {
                const config = roleConfig[r]
                const isActive = role === r
                return (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-12 font-medium transition-all ${
                      isActive
                        ? `${config.activeBg} text-white shadow-sm`
                        : `text-gray-600 ${config.hoverBg}`
                    }`}
                    title={config.description}
                  >
                    {config.icon}
                    <span>{config.name}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
