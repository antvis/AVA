import { chmod, mkdir, readFile, writeFile } from 'fs/promises';
import { homedir } from 'os';
import { join } from 'path';

const feishuHost = /(^|\.)feishu\.cn$/;
const larkHost = /(^|\.)larksuite\.com$/;

function pair(appId: unknown, appSecret: unknown, source: string) {
  const id = typeof appId === 'string' ? appId : '';
  const secret = typeof appSecret === 'string' ? appSecret : '';
  if (id && secret) {
    return { appId: id, appSecret: secret };
  }
  if (id || secret) {
    throw new Error(`Feishu Bitable source ${source} requires both appId and appSecret`);
  }
  return undefined;
}

function ask(label: string, echo: boolean) {
  process.stderr.write(label);
  const input = process.stdin;
  input.setRawMode(true);
  input.resume();
  return new Promise<string>((resolve) => {
    let value = '';
    const onData = (chunk: Buffer) => {
      const key = chunk.toString();
      if (key === '\u0003') {
        input.setRawMode(false);
        process.exit(130);
      }
      if (key === '\r' || key === '\n') {
        input.setRawMode(false);
        input.pause();
        input.off('data', onData);
        process.stderr.write('\n');
        resolve(value);
        return;
      }
      if (key === '\u007f' || key === '\b') {
        if (!value) return;
        value = value.slice(0, -1);
        if (echo) process.stderr.write('\b \b');
        return;
      } else {
        value += key;
        if (echo) process.stderr.write(key);
      }
    };
    input.on('data', onData);
  });
}

export function feishuBindError(code: unknown, msg: unknown): Error {
  const id = Number(code);
  if (id === 21001) {
    return new Error(
      [
        `飞书应用绑定失败: ${String(code)} ${String(msg ?? '')}`,
        '飞书开放平台按平台策略拒绝了这个应用，它无法换取 tenant_access_token。',
        '常见原因是应用用豆包等个人账号登录 open.feishu.cn 创建；请改用绑定手机号的飞书账号重新创建自建应用后再试。',
      ].join('\n')
    );
  }
  return new Error(
    `飞书应用绑定失败: ${String(code ?? 'unknown')} ${String(msg ?? '')}（请检查 App ID / App Secret 是否正确）`
  );
}

async function bindFeishu(url?: string) {
  const host = url && /^https?:\/\//i.test(url) ? new URL(url).hostname.toLowerCase() : '';
  const origin = larkHost.test(host) ? 'https://open.larksuite.com' : 'https://open.feishu.cn';
  const path = join(homedir(), '.ava', 'feishu.json');
  for (;;) {
    const appId = (await ask('App ID: ', true)).trim();
    if (!appId) throw new Error('已取消飞书应用绑定');
    const appSecret = (await ask('App Secret: ', false)).trim();
    const response = await fetch(`${origin}/open-apis/auth/v3/tenant_access_token/internal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        app_secret: appSecret,
      }),
    }).catch((error: unknown) => {
      throw new Error(`飞书应用绑定失败: 无法访问 ${origin}（${String((error as Error)?.message ?? error)}）`);
    });
    const body = (await response.json().catch(() => undefined)) as
      | {
          code?: unknown;
          msg?: unknown;
          tenant_access_token?: unknown;
        }
      | undefined;
    if (!body) {
      throw new Error(`飞书应用绑定失败: ${origin} 返回的不是 JSON，请确认应用属于该站点（feishu.cn 或 larksuite.com）`);
    }
    if (Number(body.code) === 21001) {
      throw feishuBindError(body.code, body.msg);
    }
    if (body.code === 0 || (typeof body.tenant_access_token === 'string' && body.tenant_access_token)) {
      await mkdir(join(homedir(), '.ava'), { recursive: true, mode: 0o700 });
      await writeFile(path, `${JSON.stringify({ appId, appSecret })}\n`, { mode: 0o600 });
      await chmod(path, 0o600);
      return { appId, appSecret };
    }
    process.stderr.write(`${feishuBindError(body.code, body.msg).message}\n`);
  }
}

export async function feishuCredentials(options: { appId?: string; appSecret?: string; url?: string }) {
  const configured =
    pair(options.appId, options.appSecret, 'configuration') ??
    pair(process.env.AVA_FEISHU_APP_ID, process.env.AVA_FEISHU_APP_SECRET, 'environment variables');
  if (configured) return configured;
  try {
    const parsed = JSON.parse(await readFile(join(homedir(), '.ava', 'feishu.json'), 'utf8')) as {
      appId?: unknown;
      appSecret?: unknown;
    };
    const saved = pair(parsed?.appId, parsed?.appSecret, '~/.ava/feishu.json');
    if (saved) return saved;
  } catch (error) {
    const missing = (error as { code?: string }).code === 'ENOENT';
    if (!missing) {
      throw error instanceof SyntaxError ? new Error('~/.ava/feishu.json is not valid JSON') : error;
    }
  }
  if (process.stdin.isTTY) return bindFeishu(options.url);
  throw new Error(
    'Feishu Bitable source requires appId and appSecret. Provide them in the source config, via AVA_FEISHU_APP_ID/AVA_FEISHU_APP_SECRET, or in ~/.ava/feishu.json'
  );
}

export function feishuUrl(dataset: string): URL | undefined {
  if (!/^https?:\/\//i.test(dataset)) {
    return undefined;
  }
  const url = new URL(dataset);
  const host = url.hostname.toLowerCase();
  if (!feishuHost.test(host) && !larkHost.test(host)) {
    return undefined;
  }
  return url;
}

export function isFeishuHostUrl(dataset: string): boolean {
  return feishuUrl(dataset) !== undefined;
}

export function isFeishuBitableUrl(dataset: string): boolean {
  const url = feishuUrl(dataset);
  if (!url) {
    return false;
  }
  const segments = url.pathname
    .split('/')
    .filter(Boolean)
    .map((segment) => segment.toLowerCase());
  const baseIndex = segments.indexOf('base');
  return baseIndex !== -1 && Boolean(segments[baseIndex + 1]) && Boolean(url.searchParams.get('table'));
}
