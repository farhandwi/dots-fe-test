/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable standalone output for Docker
  output: 'standalone',
  basePath: '/dots',
  assetPrefix: '/dots',
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    domains: [
      'localhost',
      '34.101.43.103.nip.io',
      'jktvmfiles01.tugu.com',
      'api2.tugu.com'
    ],
    unoptimized: true // For Docker compatibility
  },

  // API configuration
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: '/api/:path*',
      },
    ]
  },
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },
  
  // Environment variables
  env: {
    NEXT_PUBLIC_ENVIRONMENT: process.env.NEXT_PUBLIC_ENVIRONMENT || 'PRODUCTION',
    NEXT_PUBLIC_SSO_END_POINT: process.env.NEXT_PUBLIC_SSO_END_POINT,
    NEXT_PUBLIC_DOTS_FE_END_POINT: process.env.NEXT_PUBLIC_DOTS_FE_END_POINT,
    NEXT_PUBLIC_DOTS_BE_END_POINT: process.env.NEXT_PUBLIC_DOTS_BE_END_POINT,
    NEXT_PUBLIC_TOA_END_POINT: process.env.NEXT_PUBLIC_TOA_END_POINT,
    NEXT_PUBLIC_BPMS_BE_END_POINT: process.env.NEXT_PUBLIC_BPMS_BE_END_POINT,
    NEXT_PUBLIC_SAP_END_POINT: process.env.NEXT_PUBLIC_SAP_END_POINT,
    NEXT_PUBLIC_BASE_URL: process.env.NEXT_PUBLIC_BASE_URL,
    NEXT_PUBLIC_MFILES_END_POINT: process.env.NEXT_PUBLIC_MFILES_END_POINT,
  },

  // Build configuration
  webpack: (config, { isServer }) => {
    // Optimize bundle size
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      }
    }

    return config
  },

  // Experimental features
  experimental: {
    // Enable app directory if using Next.js 13+
    // appDir: true,
  },
};

export default nextConfig;
