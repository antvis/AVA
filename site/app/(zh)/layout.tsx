import RootDocument, { siteMetadata } from '../../components/RootDocument';
export const metadata = siteMetadata('zh');
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="zh">{children}</RootDocument>;
}
