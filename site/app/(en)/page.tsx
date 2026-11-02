import Home from '../../components/Home';
import { pageMetadata } from '../../lib/i18n';
export const metadata = pageMetadata('en', '/');
export default function Page() {
  return <Home locale="en" />;
}
