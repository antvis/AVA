import { AsyncSeriesWaterfallHook } from 'tapable';

import { BaseComponent } from './component';

export class Pipeline<Input = any, Output = any> {
  components: BaseComponent<any, any>[];

  componentsManager: AsyncSeriesWaterfallHook<any, any>;

  constructor({ components }: { components: BaseComponent<any, any>[] }) {
    this.components = components;
    this.componentsManager = new AsyncSeriesWaterfallHook(['initialParams']);

    components.forEach((component) => {
      if (!component) return;
      this.componentsManager.tapPromise(component.name, async (previousResult) => {
        const input = previousResult;
        const componentOutput = await component.executeAsync(input || {});

        return {
          ...input,
          ...componentOutput,
        };
      });
    });
  }

  async execute(initialParams: Input): Promise<Output> {
    const result = await this.componentsManager.promise(initialParams);
    return result;
  }
}
