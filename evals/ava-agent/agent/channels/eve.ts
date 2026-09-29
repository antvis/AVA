import { defineChannel } from 'eve/channels';
import { readFixture } from '../../lib/attachments.mjs';
import { eveChannel } from 'eve/channels/eve';
import { localDev, placeholderAuth, vercelOidc } from 'eve/channels/auth';

const http = eveChannel({
  auth: [vercelOidc(), localDev(), placeholderAuth()],
  uploadPolicy: { maxBytes: 100 * 1024 * 1024 },
});

export default defineChannel({
  routes: http.routes,
  // HTTP JSON erases URL instances; restore only our restricted fixture references.
  deliver: (payload) => ({
    ...payload,
    message: Array.isArray(payload.message) ? payload.message.map((part) =>
      part.type === 'file' && typeof part.data === 'string' && part.data.startsWith('ava-fixture:')
        ? { ...part, data: new URL(part.data) } : part
    ) : payload.message,
  }),
  fetchFile: (url) => readFixture(url, process.env.AVA_AGENT_RUN_DIR),
});
