'use client'

import { ReactNode } from 'react'
import { RoleProvider } from '@/contexts/RoleContext'
import { OrgProvider } from '@/contexts/OrgContext'
import { NextIntlClientProvider } from 'next-intl'

export default function ClientProviders({
  children,
  messages
}: {
  children: ReactNode
  messages: any
}) {
  return (
    <NextIntlClientProvider messages={messages}>
      <OrgProvider>
        <RoleProvider>
          {children}
        </RoleProvider>
      </OrgProvider>
    </NextIntlClientProvider>
  )
}
