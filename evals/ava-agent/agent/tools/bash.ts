import { defineTool } from 'eve/tools';
import { z } from 'zod';
import { runScript } from '../../lib/execute.mjs';

export default defineTool({
  description: 'Execute Bash in /workspace. Use for CLI commands, pipes, redirection, and files. Runs with errexit and pipefail. Each call starts a fresh shell; variables and cd do not persist, but files and background processes do. stdout/stderr are capped at 32 KiB each; execution is limited to 60 seconds.',
  inputSchema: z.object({ code: z.string().min(1).max(100000) }),
  async execute({ code }, ctx) {
    return runScript(await ctx.getSandbox(), code, 'bash', { signal: ctx.abortSignal });
  },
});
