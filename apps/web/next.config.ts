import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  transpilePackages: ['@unkora/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@unkora/ui'],
  },
};

export default nextConfig;
