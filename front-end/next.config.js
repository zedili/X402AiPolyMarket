/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable experimental features if needed
  experimental: {
    // Add any experimental features here
  },
  // Configure path aliases (handled in tsconfig.json)
  // Images configuration
  images: {
    domains: [],
  },
  // 开发环境代理：将 /api/v1/* 转发到后端 8888 端口
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8888/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;

    