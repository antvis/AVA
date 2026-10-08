/**
 * Execute LLM-generated JavaScript analysis code.
 */

import vm from 'node:vm';

import { stat } from './stat';

declare const document: any;
declare const window: any;

const EXECUTION_TIMEOUT = 10000;

function executeInBrowser(data: any[], code: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const iframe = document.createElement('iframe');
    const cleanup = () => iframe.remove();

    iframe.setAttribute('sandbox', 'allow-scripts');
    iframe.style.display = 'none';
    iframe.srcdoc = `<script>
      window.addEventListener('message', (event) => {
        try {
          const { data, stat, code } = event.data;
          const func = new Function('data', 'stat', code + '\\nreturn result;');
          parent.postMessage({ result: func(data, stat) }, '*');
        } catch (error) {
          parent.postMessage({ error: error instanceof Error ? error.message : String(error) }, '*');
        }
      });
    </script>`;

    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Failed to execute data code: execution timed out'));
    }, EXECUTION_TIMEOUT);

    iframe.onload = () => {
      iframe.contentWindow?.postMessage({ data, stat, code }, '*');
    };

    window.addEventListener(
      'message',
      function onMessage(event) {
        if (event.source !== iframe.contentWindow) return;
        clearTimeout(timer);
        window.removeEventListener('message', onMessage);
        cleanup();

        if (event.data?.error) {
          reject(new Error(`Failed to execute data code: ${event.data.error}`));
          return;
        }

        resolve(event.data?.result);
      },
    );

    document.body.appendChild(iframe);
  });
}

function executeInNode(data: any[], code: string): any {
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
      return executeInNode(data, code);
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
