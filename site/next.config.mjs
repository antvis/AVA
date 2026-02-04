/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Keep basePath empty for GitHub Pages with custom domain
  basePath: '',
  // Configure Turbopack to handle Node.js modules
  turbopack: {
    resolveAlias: {
      'better-sqlite3': './stubs/better-sqlite3.js',
    },
  },
  webpack: (config, { isServer }) => {
    // Handle Node.js modules that should not be bundled for browser
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'better-sqlite3': require.resolve('./stubs/better-sqlite3.js'),
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
      };
    }
    return config;
  },
}

export default nextConfig
