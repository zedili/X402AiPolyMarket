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
  webpack(config) {
    // Optional Node/React-Native adapters referenced by wallet libraries are not
    // used in the browser build.
    config.resolve.fallback = {
      ...config.resolve.fallback,
      '@react-native-async-storage/async-storage': false,
      'pino-pretty': false,
    };
    return config;
  },
  // 开发环境代理：将 /api/v1/* 转发到后端 8888 端口
  async rewrites() {
    if (process.env.NODE_ENV !== 'development') return [];
    return [
      {
        source: '/api/v1/:path*',
        destination: 'http://localhost:8888/api/v1/:path*',
      },
    ];
  },
};

export default nextConfig;
