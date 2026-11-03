import RootDocument, { siteMetadata } from '../../components/RootDocument';
export const metadata = siteMetadata('en');
export default function Layout({ children }: { children: React.ReactNode }) {
  return <RootDocument locale="en">{children}</RootDocument>;
}
