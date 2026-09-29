import { randomUUID } from 'node:crypto';

// Consume the entire stream, but retain only a bounded prefix in host memory.
export async function collect(stream, maxBytes) {
  const chunks = [];
  let retained = 0;
  let total = 0;

  for await (const chunk of stream) {
    const bytes = Buffer.from(chunk);
    total += bytes.length;
    const take = Math.min(bytes.length, maxBytes - retained);
    if (take > 0) chunks.push(bytes.subarray(0, take));
    retained += take;
  }

  return { text: Buffer.concat(chunks).toString('utf8'), truncated: total > maxBytes };
}

/**
 * @param {import('eve/sandbox').SandboxSession} sandbox
 * @param {string} code
 * @param {'python' | 'bash'} language
 * @param {{signal?: AbortSignal, timeoutMs?: number, maxBytes?: number}} options
 */
export async function runScript(sandbox, code, language, { signal, timeoutMs = 60000, maxBytes = 32768 } = {}) {
  const commands = { python: 'python3 -u', bash: 'bash -e -o pipefail' };
  if (!Object.hasOwn(commands, language)) throw new Error(`Unsupported language: ${language}`);
  const path = `/workspace/.${language}-${randomUUID()}`;
  const controller = new AbortController();
  const abort = () => controller.abort(signal.reason);
  let timedOut = false;
  let timer;
  let processHandle;
  let streams;

  if (signal?.aborted) throw signal.reason;
  signal?.addEventListener('abort', abort, { once: true });

  try {
    await sandbox.writeTextFile({ path, content: code, abortSignal: controller.signal });

    timer = setTimeout(() => {
      timedOut = true;
      controller.abort(new Error(`${language} execution timed out`));
    }, timeoutMs);

    processHandle = await sandbox.spawn({
      command: `${commands[language]} ${path}`,
      workingDirectory: '/workspace',
      abortSignal: controller.signal,
    });

    // Attach rejection handlers immediately, including when abort interrupts streams.
    streams = Promise.allSettled([
      collect(processHandle.stdout, maxBytes),
      collect(processHandle.stderr, maxBytes),
    ]);

    let exitCode = null;
    let error = '';

    try {
      exitCode = (await processHandle.wait()).exitCode;
    } catch (cause) {
      if (!controller.signal.aborted) error = String(cause);
    }

    const [out, err] = await streams;
    if (signal?.aborted) throw signal.reason;
    if (out.status === 'rejected' && !timedOut) throw out.reason;
    if (err.status === 'rejected' && !timedOut) throw err.reason;

    return {
      stdout: out.status === 'fulfilled' ? out.value.text : '',
      stderr: (err.status === 'fulfilled' ? err.value.text : '') + error,
      exitCode,
      timedOut,
      truncated: (out.status === 'fulfilled' && out.value.truncated) ||
        (err.status === 'fulfilled' && err.value.truncated),
    };
  } catch (cause) {
    if (signal?.aborted) throw signal.reason;
    if (timedOut) return { stdout: '', stderr: `${language} execution timed out`, exitCode: null, timedOut: true, truncated: false };
    throw cause;
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', abort);

    // Never kill successful background CLI sessions after an ordinary tool call.
    if (controller.signal.aborted && processHandle) await processHandle.kill().catch(() => {});
    await sandbox.removePath({ path, force: true }).catch(() => {});
  }
}
