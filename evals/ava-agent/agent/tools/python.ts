import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { runScript } from '../../lib/execute.mjs';

export default defineTool({
  description: 'Execute Python in the persistent session workspace. Use it for files, calculations, and subprocess commands. Each call starts a fresh Python process. stdout/stderr are capped at 32 KiB each; execution is limited to 60 seconds. Print values to inspect them.',
  inputSchema: z.object({ code: z.string().min(1).max(100000) }),
  async execute({ code }, ctx) {
    return runScript(await ctx.getSandbox(), code, 'python', { signal: ctx.abortSignal });
  },
});
