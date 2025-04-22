/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost'],
    unoptimized: true, // Temporarily disable image optimization for development
  },
}

module.exports = nextConfig 