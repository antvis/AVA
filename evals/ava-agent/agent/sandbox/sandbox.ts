import { defineSandbox } from 'eve/sandbox';
import { DockerSandbox } from 'eve/sandbox/docker';

const image = process.env.AVA_AGENT_IMAGE;
if (!image) throw new Error('Run npm run sandbox:build before starting ava-agent.');

export const environment = DockerSandbox.image(image, { pullPolicy: 'never' });
export default defineSandbox(() => environment.open({ networkPolicy: 'deny-all' }));
