/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: false,
  productionBrowserSourceMaps: true,
  
  // Enable standalone output for Docker deployment
  // Creates a minimal production bundle at .next/standalone
  output: 'standalone',
  
  // Disable image optimization for standalone mode (use external CDN in prod)
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;




