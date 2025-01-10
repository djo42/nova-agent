/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  async rewrites() {
    return [
      {
        source: '/auth/:path*',
        destination: 'https://identity-stage.goorange.sixt.com/auth/:path*',
      },
      {
        source: '/api/:path*',
        destination: 'https://api.stage.mobility.rent.sixt.com/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
