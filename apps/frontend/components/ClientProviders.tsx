'use client'

import { ReactNode } from 'react'
import { RoleProvider } from '@/contexts/RoleContext'
import { OrgProvider } from '@/contexts/OrgContext'
import { NextIntlClientProvider } from 'next-intl'

export default function ClientProviders({
  children,
  messages,
  locale
}: {
  children: ReactNode
  messages: any
  locale: string
}) {
  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      <OrgProvider>
        <RoleProvider>
          {children}
        </RoleProvider>
      </OrgProvider>
    </NextIntlClientProvider>
  )
}
