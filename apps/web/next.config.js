/** @type {import('next').NextConfig} */
const nextConfig = {
  output: process.env.VERCEL ? undefined : process.env.NETLIFY ? undefined : 'standalone',
  transpilePackages: ['@unkora/ui'],

  // ── Production hardening / performance ──
  reactStrictMode: true,
  poweredByHeader: false,             // don't advertise Next.js version
  compress: true,                     // gzip responses
  productionBrowserSourceMaps: false, // smaller bundle, no source leak in prod

  images: {
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 86400,           // cache optimized images for 24h
    deviceSizes: [640, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
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

  // ── Security headers applied to every route ──
  async headers() {
    // Content-Security-Policy — defense-in-depth against XSS. Permissive enough
    // for Next.js (inline runtime), Tailwind (inline styles) and the configured
    // analytics/image third parties, while still pinning script/connect origins.
    const apiOrigin = (() => {
      try { return new URL(process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000').origin; }
      catch { return 'http://localhost:4000'; }
    })();
    const csp = [
      "default-src 'self'",
      "base-uri 'self'",
      "object-src 'none'",
      "frame-ancestors 'self'",
      "form-action 'self'",
      "img-src 'self' data: blob: https:",
      "font-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://www.clarity.ms https://analytics.tiktok.com",
      `connect-src 'self' ${apiOrigin} https://www.google-analytics.com https://www.clarity.ms https://analytics.tiktok.com https://*.r2.dev https://images.unsplash.com`,
      'upgrade-insecure-requests',
    ].join('; ');

    const securityHeaders = [
      { key: 'Content-Security-Policy', value: csp },
      { key: 'X-DNS-Prefetch-Control', value: 'on' },
      // Force HTTPS for 2 years incl. subdomains (preload-eligible)
      { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
      // Clickjacking protection (SAMEORIGIN so first-party embeds still work)
      { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
      // Block MIME-type sniffing
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      // Don't leak full URLs to third parties
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      // Allow camera/geolocation for self (virtual try-on, delivery), block the rest + FLoC
      {
        key: 'Permissions-Policy',
        value: 'camera=(self), microphone=(), geolocation=(self), browsing-topics=()',
      },
    ];

    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

module.exports = nextConfig;
