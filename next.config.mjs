import removeImports from 'next-remove-imports';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@formatjs/intl-localematcher', 'tslib'],
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb'
    }
  },
  reactStrictMode: true,
  // Remove all console.* calls from production builds (client & server)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production'
  },
  // Supabase Storage image domain
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
  },
  // 301 redirect from old /posts/* URLs to new /* URLs
  async redirects() {
    return [
      {
        source: '/posts/:slug*',
        destination: '/:slug*',
        permanent: true, // 301 redirect
      },
    ];
  },
};

export default withNextIntl(removeImports()(nextConfig));
