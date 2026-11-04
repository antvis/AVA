import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import RecordsPage from '../../../../ai/ui/RecordsPage';
export const metadata = { title: 'Playground · 零售案例对话记录' };
export default async function Page() {
  const records = JSON.parse(await readFile(join(process.cwd(), 'public/retail-cases/playback.json'), 'utf8'));
  return <RecordsPage records={records} />;
}
