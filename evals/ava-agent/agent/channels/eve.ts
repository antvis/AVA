import { eveChannel } from 'eve/channels/eve';
import { localDev, placeholderAuth, vercelOidc } from 'eve/channels/auth';

export default eveChannel({
  auth: [vercelOidc(), localDev(), placeholderAuth()],
  uploadPolicy: { maxBytes: 100 * 1024 * 1024 },
});
