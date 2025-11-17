const withNextIntl = require('next-intl/plugin')(
  // Specify the path to the request config
  './i18n.ts'
);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
}

module.exports = withNextIntl(nextConfig)
