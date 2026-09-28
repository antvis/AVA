import { mkdir, writeFile, rename } from 'node:fs/promises';
import { join } from 'node:path';

import { defineHook } from 'eve/hooks';

import { runPython } from '../../lib/python.mjs';

// Included only in eval runs. QA scoring never reads this snapshot.
// Observe the actual chart file without adding a tool or another model turn.
export default defineHook({
  events: {
    async 'turn.completed'(_event, ctx) {
      const root = process.env.AVA_AGENT_RUN_DIR;
      if (!root) return;

      const directory = join(root, 'artifacts', encodeURIComponent(ctx.session.id));
      await mkdir(directory, { recursive: true });

      let snapshot;

      try {
        const result = await runPython(
          await ctx.getSandbox(),
          `
import json
from pathlib import Path

snapshot = {}
path = Path('/workspace/output/chart.html')

if path.is_file():
    with path.open('rb') as f:
        data = f.read(262145)

    snapshot['chart'] = {
        'content': data[:262144].decode('utf-8', errors='replace'),
        'truncated': len(data) > 262144,
    }

print(json.dumps(snapshot))
`,
          { timeoutMs: 10000, maxBytes: 2097152 }
        );

        if (result.exitCode !== 0 || result.timedOut || result.truncated) {
          throw new Error(`Chart artifact collection failed: ${result.stderr}`);
        }

        snapshot = JSON.parse(result.stdout);

        if (snapshot.chart) {
          await writeFile(join(directory, 'chart.html'), snapshot.chart.content);
        }
      } catch (error) {
        snapshot = { error: String(error) };
      }

      await writeFile(join(directory, 'snapshot.tmp'), JSON.stringify(snapshot));
      await rename(join(directory, 'snapshot.tmp'), join(directory, 'snapshot.json'));
    },
  },
});
