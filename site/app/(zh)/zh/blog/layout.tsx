import BlogLayout from '../../../../components/blog/BlogLayout';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <BlogLayout locale="zh">{children}</BlogLayout>;
}
