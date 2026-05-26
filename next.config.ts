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
    'heic-convert',
    'heic-decode',
    'jimp',
    'jpeg-js',
    'libheif-js',
    'pngjs',
    'tesseract.js',
  ],
  outputFileTracingIncludes: {
    '/admin': [
      './node_modules/heic-convert/**/*',
      './node_modules/heic-decode/**/*',
      './node_modules/jpeg-js/**/*',
      './node_modules/libheif-js/**/*',
      './node_modules/pngjs/**/*',
    ],
  },
  outputFileTracingExcludes: {
    '/admin': ['./.tmp/**/*'],
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
