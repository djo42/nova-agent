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
    ];
  },
};

export default nextConfig;
