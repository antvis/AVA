export default class Gamma {
  logGamma(x: number): number {
    const tmp = (x - 0.5) * Math.log(x + 4.5) - (x + 4.5);
    const ser =
      1.0 +
      76.18009173 / (x + 0) -
      86.50532033 / (x + 1) +
      24.01409822 / (x + 2) -
      1.231739516 / (x + 3) +
      0.00120858003 / (x + 4) -
      5.36382e-6 / (x + 5);
    return tmp + Math.log(ser * Math.sqrt(2 * Math.PI));
  }
}
