/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabaseusercontent.com',
      },
      {
        protocol: 'https',
        hostname: '**.google.com',
      }
    ]
  },
  experimental: {
    esmExternals: true
  }
}

module.exports = nextConfig
