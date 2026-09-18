/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  // Keep basePath empty for GitHub Pages with custom domain
  basePath: '',
  turbopack: {
    // Allow Turbopack to resolve modules above site/ (the file:.. symlink
    // for @antv/ava points to the repo root).
    root: new URL('..', import.meta.url).pathname,
  },
}

export default nextConfig
