import type { NextConfig } from 'next';

const isProd = process.env.NODE_ENV === 'production';

const securityHeaders = [
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
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains; preload',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self';",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline';",
      "style-src 'self' 'unsafe-inline';",
      "img-src 'self' data: blob: https://lh3.googleusercontent.com;",
      "font-src 'self' data:;",
      "object-src 'none';",
      "base-uri 'self';",
      "form-action 'self';",
      "frame-ancestors 'none';",
      isProd ? 'upgrade-insecure-requests;' : '',
    ]
      .filter(Boolean)
      .join(' '),
  },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  experimental: {
    serverActions: {
      bodySizeLimit: '6mb',
    },
  },

  async headers() {
    return [
      {
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: securityHeaders,
      },
    ];
  },

  serverExternalPackages: [
    '@prisma/adapter-better-sqlite3',
    '@prisma/adapter-libsql',
    '@libsql/client',
    'jimp',
    'tesseract.js',
  ],
  outputFileTracingIncludes: {
    '/admin': [
      './src/features/receiving/delivery-note/ocr-worker.cjs',
      './node_modules/.pnpm/tesseract.js@*/node_modules/tesseract.js/src/worker-script/**/*',
      './node_modules/.pnpm/tesseract.js@*/node_modules/tesseract.js/src/constants/**/*',
      './node_modules/.pnpm/tesseract.js@*/node_modules/tesseract.js/src/utils/**/*',
      './node_modules/.pnpm/tesseract.js-core@*/node_modules/tesseract.js-core/**/*',
      './node_modules/.pnpm/wasm-feature-detect@*/node_modules/wasm-feature-detect/**/*',
    ],
  },
  allowedDevOrigins: ['127.0.0.1'],

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
