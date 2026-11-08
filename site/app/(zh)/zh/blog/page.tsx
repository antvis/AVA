import BlogIndex, { blogMetadata } from '../../../../components/blog/BlogIndex';

export const metadata = blogMetadata('zh');
export default function Page() {
  return <BlogIndex locale="zh" />;
}
