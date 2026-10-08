/**
 * Execute LLM-generated JavaScript analysis code.
 */

import { stat, STAT_SOURCE } from './stat';

declare const document: any;
declare const window: any;

const EXECUTION_TIMEOUT = 10000;

function executeInBrowser(data: any[], code: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    let timer: ReturnType<typeof setTimeout>;
    let onMessage: (event: MessageEvent) => void;

    const cleanup = () => {
      clearTimeout(timer);
      window.removeEventListener('message', onMessage);
      iframe.onload = null;
      iframe.remove();
    };

    onMessage = (event: MessageEvent) => {
      if (event.source !== iframe.contentWindow) return;
      cleanup();

      if (event.data?.error) {
        reject(new Error(`Failed to execute data code: ${event.data.error}`));
        return;
      }

      resolve(event.data?.result);
    };

    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.display = 'none';
    iframe.srcdoc = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; style-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'">
<script>
      const toClonable = (value) => value === undefined ? value : JSON.parse(JSON.stringify(value));

      window.addEventListener('message', (event) => {
        try {
          const { data, code, stat: statSource } = event.data;
          const stat = new Function(statSource + '\\nreturn stat;')();
          const func = new Function('data', 'stat', code + '\\nreturn result;');
          parent.postMessage({ result: toClonable(func(data, stat)) }, '*');
        } catch (error) {
          parent.postMessage({ error: error instanceof Error ? error.message : String(error) }, '*');
        }
      });
    </script>`;

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('Failed to execute data code: execution timed out'));
    }, EXECUTION_TIMEOUT);

    iframe.onload = () => {
      iframe.contentWindow?.postMessage({ data, code, stat: STAT_SOURCE }, '*');
    };

    window.addEventListener('message', onMessage);
    document.body.appendChild(iframe);
  });
}

async function executeInNode(data: any[], code: string): Promise<any> {
  const vm = await import('node:vm');
  const context = vm.createContext({ data, stat });
  return vm.runInContext(`${code}\nresult;`, context, { timeout: EXECUTION_TIMEOUT });
}

/**
 * Execute analysis code with data and stat helpers.
 * The code must assign its final output to a variable named `result`.
 */
export async function executeCode(data: any[], code: string): Promise<any> {
  try {
    if (typeof document === 'undefined') {
      return await executeInNode(data, code);
    }

    return await executeInBrowser(data, code);
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : String(error);
    const message = rawMessage.startsWith('Failed to execute data code:')
      ? rawMessage
      : `Failed to execute data code: ${rawMessage.replace(/^Error:\s*/, '')}`;
    throw new Error(message);
  }
}
