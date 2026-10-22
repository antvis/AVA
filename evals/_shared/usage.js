// Missing usage stays unknown, rather than silently becoming zero.
function createUsage() {
  const value = { inputTokens: null, outputTokens: null, totalTokens: null, calls: 0 };
  return {
    value,
    add(usage) {
      for (const key of ['inputTokens', 'outputTokens', 'totalTokens']) {
        const next = usage?.[key];
        value[key] = typeof next === 'number' && Number.isFinite(next) && next >= 0 &&
          (value.calls === 0 || value[key] !== null) ? (value[key] ?? 0) + next : null;
      }
      value.calls++;
    },
  };
}

export { createUsage };
