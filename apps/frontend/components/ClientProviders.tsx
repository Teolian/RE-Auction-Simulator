'use client'

import { ReactNode } from 'react'
import { RoleProvider } from '@/contexts/RoleContext'
import { OrgProvider } from '@/contexts/OrgContext'
import { LocaleProvider, useLocale } from '@/contexts/LocaleContext'
import { NextIntlClientProvider } from 'next-intl'

function IntlWrapper({ children }: { children: ReactNode }) {
  const { locale, messages } = useLocale()

  return (
    <NextIntlClientProvider messages={messages} locale={locale}>
      {children}
    </NextIntlClientProvider>
  )
}

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <LocaleProvider>
      <IntlWrapper>
        <OrgProvider>
          <RoleProvider>
            {children}
          </RoleProvider>
        </OrgProvider>
      </IntlWrapper>
    </LocaleProvider>
  )
}
