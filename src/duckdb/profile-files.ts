import { realpath, stat } from 'node:fs/promises';
import { isAbsolute, relative, resolve, sep } from 'node:path';

type FileFrequency = { value: string; count: number };

async function profileFilePath(root: string, value: string): Promise<string> {
  const path = await realpath(resolve(root, value));
  const child = relative(root, path);
  if (child === '..' || child.startsWith(`..${sep}`) || isAbsolute(child)) {
    throw new Error(`Profile file is outside the configured root: ${value}`);
  }
  return path;
}

function fileHistogram(files: { size: number; count: number }[]) {
  const counts: number[] = [];
  const bin_edges: number[] = [];
  if (!files.length) return { bin_edges, counts };
  const sizes = new Set(files.map(({ size }) => size));
  let lo = Infinity;
  let hi = -Infinity;
  for (const size of sizes) {
    lo = Math.min(lo, size);
    hi = Math.max(hi, size);
  }
  const bins = Math.min(50, sizes.size);
  if (lo === hi) {
    const padding = lo === 0 ? 0.5 : lo * 0.1;
    return { bin_edges: [lo - padding, hi + padding], counts: [files.reduce((total, file) => total + file.count, 0)] };
  }
  const width = (hi - lo) / bins;
  for (let i = 0; i < bins; i += 1) {
    counts.push(0);
    bin_edges.push(lo + width * i);
  }
  bin_edges.push(hi);
  for (const { size, count } of files) {
    let bin = Math.min(bins - 1, Math.floor((size - lo) / width));
    if (bin > 0 && size < bin_edges[bin]) bin -= 1;
    else if (bin < bins - 1 && size >= bin_edges[bin + 1]) bin += 1;
    counts[bin] += count;
  }
  return { bin_edges, counts };
}

export async function fileSummary(paths: FileFrequency[], directory: string) {
  const root = await realpath(directory);
  if (!(await stat(root)).isDirectory()) throw new Error('Profile file root must be a directory');
  const files: Array<FileFrequency & { size: number; created_at: number; accessed_at: number; modified_at: number }> = [];
  const seconds = (millis: number) => Math.floor(millis / 1000) * 1000;
  for (let i = 0; i < paths.length; i += 16) {
    const batch = await Promise.all(
      paths.slice(i, i + 16).map(async ({ value, count }) => {
        const info = await stat(await profileFilePath(root, value));
        if (!info.isFile()) throw new Error(`Profile file is not a regular file: ${value}`);
        return {
          value,
          count,
          size: info.size,
          created_at: seconds(info.ctimeMs),
          accessed_at: seconds(info.atimeMs),
          modified_at: seconds(info.mtimeMs),
        };
      })
    );
    files.push(...batch);
  }
  return { files, histogram_file_size: fileHistogram(files) };
}
