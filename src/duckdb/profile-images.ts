import { open, stat } from 'node:fs/promises';

import { profileFilePath, profileFileRoot } from './profile-files';

type Dimensions = { width: number; height: number; count: number };

export async function supportedImage(path: string): Promise<boolean> {
  const file = await open(path, 'r');
  try {
    const header = Buffer.alloc(12);
    const { bytesRead } = await file.read(header, 0, header.length, 0);
    if (bytesRead < 4) return false;
    const signature = header.toString('hex', 0, 4);
    const brand = header.toString('ascii', 8, 12);
    return (
      signature.startsWith('ffd8ff') ||
      ['89504e47', '47494638', '49492a00', '4d4d002a'].includes(signature) ||
      (signature === '52494646' && brand === 'WEBP') ||
      (header.toString('ascii', 4, 8) === 'ftyp' && ['avif', 'avis', 'heic', 'heix', 'mif1'].includes(brand))
    );
  } finally {
    await file.close();
  }
}

function summarize(dimensions: Dimensions[], value: (entry: Dimensions) => number) {
  if (!dimensions.length) return { min: null, max: null, mean: null, median: null };
  const sorted = dimensions
    .map((entry) => ({ count: entry.count, value: value(entry) }))
    .sort((a, b) => a.value - b.value);
  const total = sorted.reduce((sum, entry) => sum + entry.count, 0);
  const mean = sorted.reduce((sum, entry) => sum + entry.value * entry.count, 0) / total;
  let seen = 0;
  let median = 0;
  for (const entry of sorted) {
    if (seen <= Math.floor((total - 1) / 2) && seen + entry.count > Math.floor((total - 1) / 2))
      median += entry.value / 2;
    if (seen <= Math.floor(total / 2) && seen + entry.count > Math.floor(total / 2)) {
      median += entry.value / 2;
      break;
    }
    seen += entry.count;
  }
  return { min: sorted[0].value, max: sorted[sorted.length - 1].value, mean, median };
}

export async function imageSummary(paths: { value: string; count: number }[], directory: string, includeExif: boolean) {
  const root = await profileFileRoot(directory);
  const { default: sharp } = await import('sharp');
  const parseExif = includeExif ? (await import('exifr')).parse : undefined;
  const dimensions = new Map<string, Dimensions>();
  const tags = new Map<string, Map<string, number>>();
  const names: Record<string, string> = {
    ModifyDate: 'DateTime',
    CreateDate: 'DateTimeDigitized',
    ISO: 'ISOSpeedRatings',
  };
  let truncated = 0;
  for (let i = 0; i < paths.length; i += 4) {
    const images = await Promise.all(
      paths.slice(i, i + 4).map(async ({ value, count }) => {
        const path = await profileFilePath(root, value);
        if (!(await stat(path)).isFile()) throw new Error(`Profile file is not a regular file: ${value}`);
        if (!(await supportedImage(path))) return null;
        const image = sharp(path, { failOn: 'truncated' });
        const info = await image.metadata().catch(() => null);
        if (!info) return null;
        const decoded = await image.stats().then(
          () => true,
          () => false
        );
        if (!decoded) return { count, truncated: true as const };
        let exif: [string, string][] = [];
        if (parseExif && info.exif) {
          const buffer = info.exif.subarray(info.exif.toString('ascii', 0, 6) === 'Exif\0\0' ? 6 : 0);
          const parsed = await parseExif(buffer, { translateValues: false, reviveValues: false }).catch(
            () => undefined
          );
          const entries = Object.entries(parsed ?? {}).filter(([name]) => !/^\d+$/.test(name));
          if (entries.every(([, item]) => typeof item === 'string')) exif = entries as [string, string][];
        }
        return { count, truncated: false as const, width: info.width, height: info.height, exif };
      })
    );
    for (const image of images) {
      if (!image) continue;
      if (image.truncated) {
        truncated += image.count;
        continue;
      }
      const { width, height, count } = image;
      const key = `${width}:${height}`;
      const dimension = dimensions.get(key) ?? { width, height, count: 0 };
      dimension.count += count;
      dimensions.set(key, dimension);
      for (const [tag, value] of image.exif) {
        const name = Object.prototype.hasOwnProperty.call(names, tag) ? names[tag] : tag;
        const counts = tags.get(name) ?? new Map<string, number>();
        counts.set(value, (counts.get(value) ?? 0) + count);
        tags.set(name, counts);
      }
    }
  }
  const sizes = [...dimensions.values()];
  const exif_data = [...tags].map(([tag, counts]) => ({
    tag,
    values: [...counts].map(([value, count]) => ({ value, count })),
  }));
  return {
    n_truncated: truncated,
    image_dimensions: sizes,
    width: summarize(sizes, ({ width }) => width),
    height: summarize(sizes, ({ height }) => height),
    area: summarize(sizes, ({ width, height }) => width * height),
    ...(includeExif && {
      exif_data,
      exif_keys_counts: exif_data.map(({ tag, values }) => ({
        value: tag,
        count: values.reduce((sum, item) => sum + item.count, 0),
      })),
    }),
  };
}
