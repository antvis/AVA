import Gamma from './Gamma';

export default class PDF {
  static predict(
    x: number,
    muT: number[],
    arr: number[],
    alphaT: number[]
  ): number[] {
    let temp = 0.0;
    const size = arr.length;

    const c = new Array(size);
    const nu = new Array(size);
    const p = new Array(size);
    const expTerm = new Array(size);

    const gamma = new Gamma();
    for (let i = 0; i < size; i+=1) {
      nu[i] = 2 * alphaT[i];
    }
    for (let i = 0; i < size; i+=1) {
      expTerm[i] = Math.exp(
        gamma.logGamma(nu[i] / 2 + 0.5) - gamma.logGamma(nu[i] / 2)
      );
    }
    for (let i = 0; i < size; i+=1) {
      c[i] = arr[i] * nu[i] * Math.PI;
      c[i] = c[i] ** -0.5 * expTerm[i];
    }
    for (let i = 0; i < size; i+=1) {
      temp = 1 + (1 / (nu[i] * arr[i])) * (x - muT[i]) ** 2;
      temp **= (-(nu[i] + 1) / 2);
      p[i] = c[i] * temp;
    }
    return p;
  }
}
