import { AdvisorOptions, Advice, dataToSpecs, specToLibConfig } from './advice-pipeline';
import EventEmitter from '@antv/event-emitter';
import * as G2Plot from '@antv/g2plot';
import { uuid, createLayer, DEFAULT_FEEDBACK } from './util';

export interface Configs {
  theme?: string;
  data: any[];
}

/**
 *
 * @param advice - 图表类型以及通道配置
 * @param data - 数据
 * @param configs - 配置
 */
function getConfig(advice: Advice, { theme, data }: Configs): any {
  const configs: any = { ...specToLibConfig(advice, 'G2Plot')?.configs };
  configs.autoFit = true;
  return { ...configs, theme, data };
}

export interface AutoPlotOptions extends AdvisorOptions {
  theme?: string;
  feedback?: (container: HTMLDivElement) => void;
}

/**
 * 智能图表
 */
export class AutoPlot extends EventEmitter {
  /**
   * 图表Schema列表
   */
  advices: Advice[] = [];
  /**
   * 图表渲染容器
   */
  container: HTMLElement;
  /**
   * 图表唯一ID
   */
  uuid: string = uuid();
  /**
   * 当前激活(使用)的图表schema
   */
  current = 0;
  /**
   * G2plot 图表实例
   */
  plot?: any;
  /**
   * 图表的配置
   */
  currentConfigs?: any;
  /**
   * 图表的类型
   */
  type?: string;

  private options: AutoPlotOptions;
  private data: any[];
  private feedbackLayer: HTMLDivElement;
  private feedback: (container: HTMLDivElement) => void;

  /**
   * Constructor
   * @param container - 图表容器
   * @param data - 图表数据
   * @param options - 图表配置
   * @param oldAdvices - 同一个容器上次渲染的 advice列表
   * @param oldIndex - 同一个容器上次渲染的目标位置
   */
  constructor(
    container: HTMLElement,
    data: any[],
    options: AutoPlotOptions = {},
    oldAdvices: Advice[] = [],
    oldIndex = 0,
    type?: string
  ) {
    super();
    const { width, height } = container.getBoundingClientRect();
    if (!options.preferences || !options.preferences.canvasLayout) {
      options.preferences = {
        canvasLayout: width / height > 1 ? 'landscape' : 'portrait',
      };
    }
    this.container = container;
    this.feedbackLayer = createLayer(container, 'feedback-layer');
    const advices = dataToSpecs(data, options);
    this.advices = advices;
    this.options = options;
    this.feedback = this.options.feedback || DEFAULT_FEEDBACK('暂无推荐');
    this.data = data;
    if (this.advices.length === 0) {
      // throw new Error('推荐不了图表');
      this.feedback(this.feedbackLayer);
    } else {
      // 如果和上次的结果一样 可以认定为是重复渲染，然后使用上次的index
      if (advices.length === oldAdvices.length && advices.every((item, i) => item.type === advices[i].type)) {
        this.render(oldIndex);
      } else if (type) {
        let index = 0;
        for (let i = 0; i < advices.length; i++) {
          if (advices[i].type === type) {
            index = i;
          }
        }
        this.render(index);
      } else {
        this.render(0);
      }
    }
  }

  /**
   * 渲染指定位置的schema
   * @param index - schema 的index
   */
  render(index: number): void {
    const { advices, options, data, container, current, plot } = this;
    if (plot && index === current) return;
    this.current = index;
    const { type } = advices[index];
    const currentType = advices[current].type;
    const { theme } = options;
    const libConfig = specToLibConfig(advices[index], 'G2Plot');
    const configs = getConfig(advices[index], { theme, data });
    this.currentConfigs = configs;
    this.type = type;

    if (libConfig) {
      const configs: any = { ...libConfig?.configs, data, theme };
      this.currentConfigs = configs;
      this.type = type;
      if (plot && type === currentType) {
        plot.update(configs);
      } else {
        if (plot) plot.destroy();
        console.log(' 🐛🐛🐛 type');
        console.log(type);
        this.plot = new G2Plot[libConfig.type](container, configs);
      }
      this.plot!.render();
      // 出发事件
      this.emit('change', [index]);
    }
  }

  destroy() {
    if (this.plot && !this.plot.destroyed) {
      this.plot.destroy();
      this.container.removeChild(this.feedbackLayer);
      this.plot = undefined;
    }
  }
}
