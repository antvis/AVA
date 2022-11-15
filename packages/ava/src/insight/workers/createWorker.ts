import { MESSAGE } from './constant';

interface Event {
  type: string;
  data: any;
}

/**
 * run a task on web workers
 * @param type task type
 */
const createWorker =
  <R>(type: string) =>
  (...data) =>
    new Promise<R>((resolve, reject) => {
      const worker = new Worker(new URL('index.worker.js', import.meta.url), {
        type: 'module',
      });
      worker.postMessage({
        taskType: type,
        data,
      });

      worker.onmessage = (event: Event) => {
        const { data, status } = event.data;
        if (MESSAGE.SUCCESS === status) {
          resolve(data);
        } else {
          reject();
        }

        worker.terminate();
      };
    });

export default createWorker;
