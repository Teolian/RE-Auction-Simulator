import createMiddleware from 'next-intl/middleware';
import {locales} from './i18n';

export default createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale: 'en',

  // Don't use locale prefix in URL for default locale
  localePrefix: 'as-needed'
});

export const config = {
  // Match only internationalized pathnames
  matcher: ['/', '/(ja|en)/:path*']
};
