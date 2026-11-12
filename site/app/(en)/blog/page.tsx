import BlogIndex, { blogMetadata } from '../../../components/blog/BlogIndex';

export const metadata = blogMetadata('en');
export default function Page() {
  return <BlogIndex locale="en" />;
}
