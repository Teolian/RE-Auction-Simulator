import '../globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navigation from '@/components/Navigation'
import { RoleProvider } from '@/contexts/RoleContext'
import { OrgProvider } from '@/contexts/OrgContext'
import {NextIntlClientProvider} from 'next-intl';
import {getMessages} from 'next-intl/server';

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'RE-Auction Simulator',
  description: 'Renewable Energy Auction Platform',
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
    <html lang={locale}>
      <body className={inter.className}>
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
      </body>
    </html>
  )
}
