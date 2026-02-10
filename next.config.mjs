import removeImports from 'next-remove-imports';

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
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
  // 301 redirects
  async redirects() {
    return [
      // Old /posts/* URLs to new /* URLs
      {
        source: '/posts/:slug*',
        destination: '/:slug*',
        permanent: true,
      },
      // English locale URLs to Korean (default)
      {
        source: '/en',
        destination: '/',
        permanent: true,
      },
      {
        source: '/en/:slug*',
        destination: '/:slug*',
        permanent: true,
      },
    ];
  },
};

export default removeImports()(nextConfig);
