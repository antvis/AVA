import createMDX from '@next/mdx';

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
};

const withMDX = createMDX({
  options: {
    remarkPlugins: ['remark-gfm'],
    rehypePlugins: ['rehype-slug', ['rehype-pretty-code', { theme: 'github-light', keepBackground: false }]],
  },
});

export default withMDX(nextConfig);
