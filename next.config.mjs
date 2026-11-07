/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['pdf-parse', 'mammoth', 'xlsx'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;

