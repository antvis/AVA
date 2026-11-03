import DocumentationLayout from '../../../components/docs/DocumentationLayout';
export default function Layout({ children }: { children: React.ReactNode }) {
  return <DocumentationLayout locale="en">{children}</DocumentationLayout>;
}
