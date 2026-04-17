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
  async redirects() {
    return [
      {
        // Esta regla captura el link con punto final y lo limpia para evitar el 404
        source: '/reset-password.',
        destination: '/reset-password',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
