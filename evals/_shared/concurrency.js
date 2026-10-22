// Wait for every worker before propagating an error, so callers can safely release run locks.
async function forEachConcurrent(items, concurrency, visit) {
  let cursor = 0;
  const workers = await Promise.allSettled(
    Array.from({ length: Math.min(concurrency, items.length) }, async () => {
      while (cursor < items.length) {
        const index = cursor++;
        await visit(items[index], index);
      }
    })
  );
  const failed = workers.find((worker) => worker.status === 'rejected');
  if (failed) throw failed.reason;
}

export { forEachConcurrent };
