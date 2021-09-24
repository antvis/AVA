import PDF from './PDF';

export type Iteratee<T> = (t: T, index: number) => number;

export type BreakPointVerifier<T> = (
  next: BreakPoint<T>,
  prev: BreakPoint<T>
) => boolean;

export type BreakPoint<T> = {
  data: T;
  index: number;
};

const chunker = <T>(arr: T[], chunkSize: number): T[][] => {
  const temp: T[][] = [];
  for (let i = 0, j = arr.length; i < j; i += chunkSize) {
    temp.push(arr.slice(i, i + chunkSize));
  }
  return temp;
};

const defaultIteratee = <T>(t: T): number => {
  if (typeof t === 'number') {
    return t;
  }

  throw Error('Specifiy an iteratee');
};

export class BayesianChangePoint<T = number> {
  private breakpointVerifier: BreakPointVerifier<T>;

  private iteratee: Iteratee<T>;

  private chunkSize: number;

  private init: boolean;

  private maximum: number[];

  private model: number[][];

  private mu0: number;

  private kappa0: number;

  private alpha0: number;

  private beta0: number;

  private breakPointsSet: BreakPoint<T>[];

  private iteration: number;

  private muT: number[];

  private kappaT: number[];

  private alphaT: number[];

  private betaT: number[];

  private data: T[];

  private size: number;

  constructor({
    breakpointVerifier,
    iteratee = defaultIteratee,
    chunkSize = 1000
  }: {
    breakpointVerifier: BreakPointVerifier<T>;
    iteratee?: Iteratee<T>;
    chunkSize?: number;
  }) {
    this.iteratee = iteratee;
    this.breakpointVerifier = breakpointVerifier;
    this.chunkSize = chunkSize;
    this.init = false;
    this.maximum = [];
    this.model = [];
    this.mu0 = 0.0;
    this.kappa0 = 1.0;
    this.alpha0 = 1.0;
    this.beta0 = 1.0;
    this.muT = [this.mu0];
    this.kappaT = [this.kappa0];
    this.alphaT = [this.alpha0];
    this.betaT = [this.beta0];
    this.breakPointsSet = [];
    this.iteration = 0;
    this.data = [];
    this.size = 0;
  }

  exec(data: T[]) {
    const { chunkSize } = this;

    if (!this.init) {
      const maximum = new Array(chunkSize + 1).fill(0);

      const model = new Array(chunkSize + 1).fill(0);

      this.maximum = maximum;
      this.model = model;

      for (let i = 0; i < model.length; i+= 1) {
        model[i] = new Array(chunkSize + 1).fill(0);
      }

      model[0][0] = 1;

      this.mu0 = 0.0;
      this.kappa0 = 1.0;
      this.alpha0 = 1.0;
      this.beta0 = 1.0;
      this.muT = [this.mu0];
      this.kappaT = [this.kappa0];
      this.alphaT = [this.alpha0];
      this.betaT = [this.beta0];
      this.breakPointsSet = [];
      this.iteration = 0;

      this.init = true;
    }

    const chunks = chunker(data, chunkSize);

    for (let i = 0; i < chunks.length; i += 1) {
      const data = chunks[0];

      this.data = data;
      this.size = data.length;
      this.iteration = i;

      this.run();
      this.computeBreakPoints();

      const { model } = this;
      const lastPrior = model[model.length - 1];

      for (let i = 0; i < model.length; i += 1) {
        model[i] = new Array<number>(chunkSize + 1).fill(0);
      }

      model[0] = lastPrior;
      model[0][0] = 1;
    }
  }

  private get(i: number): number {
    return this.iteratee(this.data[i], i);
  }

  private run() {
    let H;
    let sum;
    let normSum;
    let maxVal;
    let maxIdx = 0;

    for (let t = 0; t < this.size; t += 1) {
      const arr = new Array(t + 1);

      for (let i = 0; i <= t; i += 1) {
        arr[i] =
          (this.betaT[i] * (this.kappaT[i] + 1)) /
          (this.alphaT[i] * this.kappaT[i]);
      }

      const predictedProbabilities = PDF.predict(
        this.get(t),
        this.muT,
        arr,
        this.alphaT
      );

      H = 0.005;

      for (let idx = 1; idx <= t + 1; idx += 1) {
        this.model[idx][t + 1] =
          this.model[idx - 1][t] * predictedProbabilities[idx - 1] * (1 - H);
      }

      sum = 0.0;
      for (let idx = 0; idx <= t; idx += 1) {
        sum += this.model[idx][t] * predictedProbabilities[idx] * H;
      }

      this.model[0][t + 1] = sum;
      normSum = 0.0;

      for (let idx = 0; idx < this.size; idx += 1) {
        normSum += this.model[idx][t + 1];
      }

      for (let idx = 0; idx <= this.size; idx += 1) {
        this.model[idx][t + 1] = this.model[idx][t + 1] / normSum;
      }

      this.update(t);

      maxVal = Number.MIN_VALUE;

      for (let idx = 0; idx <= t; idx += 1) {
        if (this.model[idx][t] > maxVal) {
          maxVal = this.model[idx][t];
          maxIdx = idx;
        }
      }

      this.maximum[t] = maxIdx;
    }
  }

  private update(t: number) {

    const muT0Temp = new Array(t + 2);
    const kappaT0Temp = new Array(t + 2);
    const alphaT0Temp = new Array(t + 2);
    const betaT0Temp = new Array(t + 2);

    muT0Temp[0] = this.mu0;
    kappaT0Temp[0] = this.kappa0;
    alphaT0Temp[0] = this.alpha0;
    betaT0Temp[0] = this.beta0;

    for (let i = 0; i <= t; i+= 1) {
      muT0Temp[i + 1] =
        (this.kappaT[i] * this.muT[i] + this.get(t)) / (this.kappaT[i] + 1);
      kappaT0Temp[i + 1] = this.kappaT[i] + 1;
      alphaT0Temp[i + 1] = this.alphaT[i] + 0.5;
      betaT0Temp[i + 1] =
        this.betaT[i] +
        (this.kappaT[i] * (this.get(t) - this.muT[i]) ** 2) /
          (2 * (this.kappaT[i] + 1));
    }

    this.muT = muT0Temp;
    this.kappaT = kappaT0Temp;
    this.alphaT = alphaT0Temp;
    this.betaT = betaT0Temp;
  }

  private computeIndex(index: number) {
    return this.iteration * this.chunkSize + index;
  }

  private computeBreakPoints() {
    const breakPoints = this.breakPointsSet;
    let breakPoint = 0;
    let lastBreakPoint: BreakPoint<T> = breakPoints[0];

    for (let i = 1; i < this.size; i+=1) {
      if (this.maximum[i - 1] > this.maximum[i]) {
        breakPoint = i - this.maximum[i];

        if (breakPoints.length === 0) {
          lastBreakPoint = {
            data: this.data[breakPoint],
            index: this.computeIndex(breakPoint)
          };
          breakPoints.push(lastBreakPoint);
        } else {
          const potentialBreakpoint = {
            data: this.data[breakPoint],
            index: this.computeIndex(breakPoint)
          };

          if (this.breakpointVerifier(potentialBreakpoint, lastBreakPoint)) {
            lastBreakPoint = potentialBreakpoint;
            breakPoints.push(lastBreakPoint);
          }
        }
      }
    }
  }

  breakPoints(): BreakPoint<T>[] {
    return [...this.breakPointsSet].sort((a, b) => a.index - b.index);
  }
}
