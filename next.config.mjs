/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {},
  experimental: {
    serverActions: {
      bodySizeLimit: '20mb',
    },
  },
  reactStrictMode: true,
  // Remove console.* calls from production builds, but keep error/warn for debugging
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
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
    ];
  },
};

export default nextConfig;
