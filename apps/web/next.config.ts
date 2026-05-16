import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // 'standalone' for Docker/Railway self-hosted deployments.
  // Cloudflare Pages: set BUILD_TARGET=cloudflare in environment to skip this.
  output: process.env.BUILD_TARGET === 'cloudflare' ? undefined : 'standalone',
  transpilePackages: ['@unkora/ui'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.r2.dev' },
      { protocol: 'https', hostname: '**.cloudflare.com' },
      { protocol: 'https', hostname: 'picsum.photos' },
      { protocol: 'https', hostname: 'fastly.picsum.photos' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
    ],
  },
  experimental: {
    optimizePackageImports: ['lucide-react', '@unkora/ui'],
  },
};

export default nextConfig;
