import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  serverExternalPackages: [
    '@prisma/adapter-better-sqlite3',
    '@prisma/adapter-libsql',
    '@libsql/client',
    'jimp',
    'tesseract.js',
  ],
  allowedDevOrigins: ['127.0.0.1'],
};

export default nextConfig;
