import type { BasePipeline } from './types';

type AsArray<T> = T extends any[] ? T : [T];

export abstract class AdvisorPlugin<I, O> {
  name: string;

  constructor(name: string) {
    this.name = name;
  }

  apply: (pipeline: BasePipeline) => void;

  execute?: (...args: AsArray<I>) => O = () => {
    throw new Error('method should be implement by sub class');
  };

  executeAsync?: (...args: AsArray<I>) => Promise<O> = async () => {
    return Promise.reject(new Error('method should be implement by sub class'));
  };
}
