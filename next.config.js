/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true, // Temporarily disable image optimization for development
  },
  // Add ESLint configuration to ignore during builds
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure we're not using experimental features that could cause issues
  experimental: {
    serverActions: true,
    typedRoutes: true,
    turbo: false, // Explicitly disable TurboPack
  },
  // Set output to 'standalone' for better compatibility
  output: 'standalone',
}

module.exports = nextConfig 