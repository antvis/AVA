import DocPage, { docMetadata } from '../../components/docs/DocPage';
import { docs } from '../../lib/docs';

export const metadata = docMetadata(docs[0]);
export default function IntroductionPage() {
  return <DocPage doc={docs[0]} />;
}
