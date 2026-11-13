function transform(real: Float64Array, imaginary: Float64Array, inverse = false): void {
  const size = real.length;
  for (let i = 1, reversed = 0; i < size; i += 1) {
    let bit = size >>> 1;
    while (reversed & bit) {
      reversed ^= bit;
      bit >>>= 1;
    }
    reversed ^= bit;
    if (i < reversed) {
      [real[i], real[reversed]] = [real[reversed], real[i]];
      [imaginary[i], imaginary[reversed]] = [imaginary[reversed], imaginary[i]];
    }
  }
  for (let width = 2; width <= size; width *= 2) {
    const half = width / 2;
    const angle = ((inverse ? 2 : -2) * Math.PI) / width;
    const stepReal = Math.cos(angle);
    const stepImaginary = Math.sin(angle);
    for (let start = 0; start < size; start += width) {
      let wr = 1;
      let wi = 0;
      for (let j = start; j < start + half; j += 1) {
        const k = j + half;
        const productReal = wr * real[k] - wi * imaginary[k];
        const productImaginary = wr * imaginary[k] + wi * real[k];
        real[k] = real[j] - productReal;
        imaginary[k] = imaginary[j] - productImaginary;
        real[j] += productReal;
        imaginary[j] += productImaginary;
        const nextReal = wr * stepReal - wi * stepImaginary;
        wi = wr * stepImaginary + wi * stepReal;
        wr = nextReal;
      }
    }
  }
  if (inverse) {
    for (let i = 0; i < size; i += 1) {
      real[i] /= size;
      imaginary[i] /= size;
    }
  }
}

function spectrumComponents(values: number[]): [Float64Array, Float64Array] {
  const n = values.length;
  if ((n & (n - 1)) === 0) {
    const real = Float64Array.from(values);
    const imaginary = new Float64Array(n);
    transform(real, imaginary);
    return [real, imaginary];
  }

  // Bluestein's convolution keeps the original frequency grid for any series length.
  const size = 2 ** Math.ceil(Math.log2(2 * n - 1));
  const real = new Float64Array(size);
  const imaginary = new Float64Array(size);
  const chirpReal = new Float64Array(size);
  const chirpImaginary = new Float64Array(size);
  for (let i = 0; i < n; i += 1) {
    const angle = (Math.PI * ((i * i) % (2 * n))) / n;
    const cosine = Math.cos(angle);
    const sine = Math.sin(angle);
    real[i] = values[i] * cosine;
    imaginary[i] = -values[i] * sine;
    chirpReal[i] = cosine;
    chirpImaginary[i] = sine;
    if (i) {
      chirpReal[size - i] = cosine;
      chirpImaginary[size - i] = sine;
    }
  }
  transform(real, imaginary);
  transform(chirpReal, chirpImaginary);
  for (let i = 0; i < size; i += 1) {
    const productReal = real[i] * chirpReal[i] - imaginary[i] * chirpImaginary[i];
    imaginary[i] = real[i] * chirpImaginary[i] + imaginary[i] * chirpReal[i];
    real[i] = productReal;
  }
  transform(real, imaginary, true);
  return [real, imaginary];
}

export function frequencySpectrum(values: number[], madThreshold: number) {
  const frequencies: number[] = [];
  const decibels: number[] = [];
  if (values.length > 2) {
    const [real, imaginary] = spectrumComponents(values);
    for (let i = 1; i < values.length / 2; i += 1) {
      frequencies.push(i / values.length);
      decibels.push(20 * Math.log10(Math.hypot(real[i], imaginary[i])));
    }
  }
  const positive = decibels.filter((value) => Number.isFinite(value) && value > 0).sort((a, b) => a - b);
  const median = (positive[Math.floor((positive.length - 1) / 2)] + positive[Math.floor(positive.length / 2)]) / 2;
  const aboveMedian = positive.filter((value) => value > median);
  const mean = aboveMedian.reduce((sum, value) => sum + value, 0) / aboveMedian.length;
  const mad = aboveMedian.reduce((sum, value) => sum + Math.abs(value - mean), 0) / aboveMedian.length;
  const threshold = median + mad * madThreshold;
  const points = decibels.map((value, i) => ({
    frequency: frequencies[i],
    decibels: Number.isFinite(value)
      ? value
      : value === -Infinity
      ? '-Infinity'
      : value === Infinity
      ? 'Infinity'
      : null,
  }));
  const peaks = points.filter((_, i) => decibels[i] - decibels[i - 1] >= 0.1 && decibels[i] - decibels[i + 1] >= 0.1);
  const candidates = peaks.filter(({ decibels }) => typeof decibels === 'number' && decibels > threshold);
  const selected = candidates.filter(({ frequency }, i) => {
    for (let j = 0; j < i; j += 1) {
      const remainder = (frequency / candidates[j].frequency) % 1;
      if (remainder < 0.01 || remainder > 0.99) return false;
    }
    return true;
  });
  return {
    points,
    threshold: Number.isFinite(threshold) ? threshold : null,
    peaks,
    selected_peaks: selected,
    seasonal: selected.length > 0,
    periods: selected.map(({ frequency }) => 1 / frequency),
  };
}
