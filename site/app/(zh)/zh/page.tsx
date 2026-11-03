import Home from '../../../components/Home';
import { pageMetadata } from '../../../lib/i18n';
export const metadata = pageMetadata('zh', '/');
export default function Page() {
  return <Home locale="zh" />;
}
