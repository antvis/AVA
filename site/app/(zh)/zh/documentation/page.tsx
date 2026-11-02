import DocPage, { docMetadata } from '../../../../components/docs/DocPage';
import { docs } from '../../../../lib/docs';

export const metadata = docMetadata(docs[0], 'zh');
export default function IntroductionPage() {
  return <DocPage locale="zh" doc={docs[0]} />;
}
