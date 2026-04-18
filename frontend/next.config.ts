import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        pathname: '**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/__/auth/:path*',
        destination: `https://fiboochat.firebaseapp.com/__/auth/:path*`,
      },
      {
        source: '/__/firebase/:path*',
        destination: `https://fiboochat.firebaseapp.com/__/firebase/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://apis.google.com https://www.gstatic.com https://www.google-analytics.com https://identitytoolkit.googleapis.com https://*.firebaseapp.com https://*.firebase.com https://*.google.com https://fidooo-prueba.vercel.app; connect-src 'self' http://localhost:3001 https://fidooo-prueba.vercel.app https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://*.groq.com; frame-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://*.firebase.com https://*.google.com https://fidooo-prueba.vercel.app; frame-ancestors 'self'; img-src 'self' blob: data: https://lh3.googleusercontent.com https://*.firebaseapp.com https://*.google.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; base-uri 'self'; form-action 'self' https://*.firebaseapp.com https://*.googleapis.com; upgrade-insecure-requests; object-src 'none';"
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin-allow-popups'
          },
          {
            key: 'Cross-Origin-Resource-Policy',
            value: 'same-site'
          },
          {
            key: 'X-Fidooo-Deployment',
            value: 'v1.23-CACHE-KILLER'
          }
        ],
      },
    ];
  },
};

export default nextConfig;
