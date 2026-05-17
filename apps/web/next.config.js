/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.BUILD_TARGET === 'docker' ? 'standalone' : undefined,
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

module.exports = nextConfig;
