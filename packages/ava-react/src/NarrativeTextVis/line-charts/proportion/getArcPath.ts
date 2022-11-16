export function getArcPath(size: number, data: number) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const angle = normalizeProportion(data) * 2 * Math.PI;
  const dx = cx + r * Math.sin(angle);
  const dy = cy - r * Math.cos(angle);
  const path = `
    M${cx} ${0}
    A ${cx} ${cy} 0 ${angle > Math.PI ? 1 : 0} 1 ${dx} ${dy}
    L ${cx} ${cy} Z
  `;
  return path;
}

/**
 * make data between 0 ~ 1
 */
function normalizeProportion(data: number | undefined) {
  if (typeof data !== 'number') return 0;
  if (data > 1) return 1;
  if (data < 0) return 0;
  return data;
}
