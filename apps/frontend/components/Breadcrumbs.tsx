'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs from pathname if not provided
  const breadcrumbs = items || generateBreadcrumbs(pathname)

  if (breadcrumbs.length <= 1) {
    return null // Don't show breadcrumbs for home page or single-level pages
  }

  return (
    <nav className="flex items-center gap-2 text-14 mb-6">
      {breadcrumbs.map((item, index) => {
        const isLast = index === breadcrumbs.length - 1

        return (
          <div key={index} className="flex items-center gap-2">
            {index > 0 && (
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            )}
            {isLast || !item.href ? (
              <span className="text-gray-900 font-medium">{item.label}</span>
            ) : (
              <Link
                href={item.href}
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                {item.label}
              </Link>
            )}
          </div>
        )
      })}
    </nav>
  )
}

function generateBreadcrumbs(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split('/').filter(Boolean)

  const breadcrumbs: BreadcrumbItem[] = [
    { label: 'Dashboard', href: '/' }
  ]

  let currentPath = ''

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    currentPath += `/${segment}`

    // Check if segment is a number (likely an ID)
    const isId = /^\d+$/.test(segment)

    // Determine label
    let label = segment
    if (isId) {
      const prevSegment = segments[i - 1]
      if (prevSegment === 'auctions') label = `Auction #${segment}`
      else if (prevSegment === 'lots') label = `Lot #${segment}`
      else if (prevSegment === 'bids') label = `Bid #${segment}`
      else if (prevSegment === 'interviews') label = `Interview #${segment}`
      else if (prevSegment === 'contracts') label = `Contract #${segment}`
      else label = `#${segment}`
    } else {
      // Capitalize and format
      label = formatLabel(segment)
    }

    // Don't link to the current page
    const isLast = i === segments.length - 1

    breadcrumbs.push({
      label,
      href: isLast ? undefined : currentPath
    })
  }

  return breadcrumbs
}

function formatLabel(segment: string): string {
  // Map of special cases
  const labelMap: Record<string, string> = {
    'auctions': 'Auctions',
    'lots': 'Lots',
    'bids': 'Bids',
    'interviews': 'Interviews (面談)',
    'contracts': 'Contracts',
    'plants': 'Plants',
    'create': 'Create New',
    'edit': 'Edit',
  }

  return labelMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1)
}
