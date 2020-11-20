import * as G2Plot from '@antv/g2plot';
import { uuid } from './util';

export interface DummyPlotConfig {
  type: string; // g2plot chart class type name
  configs: any;
}

export class DummyPlot {
  plot!: any;
  uuid: string = uuid();
  container: HTMLElement;
  private config: DummyPlotConfig;
  private data: any[];
  type?: string;
  currentConfigs?: any;

  constructor(container: HTMLElement, data: any[], config: DummyPlotConfig) {
    this.container = container;
    this.config = config;
    this.data = data;
    this.render();
  }

  render() {
    const { config, container, data } = this;
    const { type, configs } = config;
    this.currentConfigs = { ...configs, data };
    this.type = type;
    try {
      // @ts-ignore
      this.plot = new G2Plot[type](container, { ...configs, data });
      this.plot.render();
    } catch (e) {
      throw new Error('current config is not supported by g2plot');
    }
  }

  destroy() {
    if (this.plot && !this.plot.destroyed) {
      this.plot.destroy();
    }
  }
}
