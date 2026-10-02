/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/:path*`,
      },
    ];
  },
  async redirects() {
    return [
      { source: '/company', destination: '/dashboard/organizations', permanent: false },
      { source: '/organization', destination: '/dashboard/organizations', permanent: false },
      { source: '/departments', destination: '/dashboard/departments', permanent: false },
      { source: '/agents', destination: '/dashboard/agents', permanent: false },
      { source: '/projects', destination: '/dashboard/projects', permanent: false },
      { source: '/tasks', destination: '/dashboard/tasks', permanent: false },
      { source: '/workflows', destination: '/dashboard/workflows', permanent: false },
      { source: '/intelligence', destination: '/dashboard/intelligence', permanent: false },
      { source: '/resources', destination: '/dashboard/resources', permanent: false },
      { source: '/memory', destination: '/dashboard/memory', permanent: false },
      { source: '/decisions', destination: '/dashboard/decisions', permanent: false },
      { source: '/approvals', destination: '/dashboard/approvals', permanent: false },
      { source: '/activity', destination: '/dashboard/activity', permanent: false },
      { source: '/evolution', destination: '/dashboard/evolution', permanent: false },
      { source: '/simulation', destination: '/dashboard/simulation', permanent: false },
      { source: '/settings', destination: '/dashboard/settings', permanent: false },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
};

module.exports = nextConfig;