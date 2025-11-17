import type { Metadata } from 'next'
import Navigation from '@/components/Navigation'
import { RoleProvider } from '@/contexts/RoleContext'
import { OrgProvider } from '@/contexts/OrgContext'
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';
import {locales} from '@/i18n';

export const metadata: Metadata = {
  title: 'RE-Auction Simulator',
  description: 'Renewable Energy Auction Platform',
}

export function generateStaticParams() {
  return locales.map((locale) => ({locale}));
}

export default async function LocaleLayout({
  children,
  params: {locale}
}: {
  children: React.ReactNode;
  params: {locale: string};
}) {
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <OrgProvider>
        <RoleProvider>
          <div className="min-h-screen bg-gray-50">
            <Navigation />
            <main className="max-w-[1400px] mx-auto px-8 py-8">
              {children}
            </main>
          </div>
        </RoleProvider>
      </OrgProvider>
    </NextIntlClientProvider>
  )
}
