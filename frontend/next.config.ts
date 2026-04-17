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
            value: [
              "default-src 'self';",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com https://www.gstatic.com;",
              "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://*.groq.com;",
              "frame-src 'self' https://*.firebaseapp.com https://*.googleapis.com https://apis.google.com;",
              "img-src 'self' data: https://*.googleusercontent.com https://*.firebaseapp.com;",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;",
              "font-src 'self' https://fonts.gstatic.com;",
              "object-src 'none';"
            ].join(' ')
          }
        ],
      },
    ];
  },
};

export default nextConfig;
