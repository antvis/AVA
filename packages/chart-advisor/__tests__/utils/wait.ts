/**
 * make test async
 */
export async function wait(ms?: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('');
    }, ms || 0);
  });
}
