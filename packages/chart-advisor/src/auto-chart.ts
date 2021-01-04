import { ConfigPanel } from './config-panel';
import { Toolbar } from './toolbar';
import { AutoPlot } from './auto-plot';
import { DummyPlot } from './dummy-plot';
import { isEqual, pick } from '@antv/util';
import { AdvisorOptions, Advice, G2PlotConfig } from './advice-pipeline';
import { Preferences, ChartRuleConfigMap } from './rules';
import { MockPanel } from './mock-panel';
import { createLayer, DEFAULT_FEEDBACK } from './util';
export { Preferences };

const CACHES: Map<HTMLElement, AutoChart> = new Map();

/**
 * clean the instance binding with the destroyed container
 */
function CheckAndClean(): void {
  for (const [container, chart] of CACHES.entries()) {
    if (!document.contains(container)) {
      chart.destroy();
      CACHES.delete(container);
    }
  }
  window.requestAnimationFrame(CheckAndClean);
}

window.requestAnimationFrame(CheckAndClean);

/**
 * autochart configs
 * @public
 */
export interface AutoChartOptions extends AdvisorOptions {
  /**
   * title
   */
  title?: string;
  /**
   * description
   */
  description?: string;
  /**
   * data columns(fields)
   */
  fields?: string[];
  /**
   * chart type switch tool
   * */
  toolbar?: boolean;
  /**
   * dev mode
   * */
  development?: boolean;
  /**
   * theme
   */
  theme?: string;
  /**
   * g2plot configs
   */
  config?: G2PlotConfig;
  /**
   * render while no data
   */
  noDataContent?: (container: HTMLDivElement) => void;
  /** render while no recommend result */
  feedback?: (container: HTMLDivElement) => void;
}

export { AdvisorOptions, ChartRuleConfigMap };

export function addCanvas(layer: HTMLElement, { title, description }: AutoChartOptions): HTMLDivElement {
  layer.style.display = 'flex';
  layer.style.flexDirection = 'column';
  layer.style.padding = '24px';
  if (title) {
    const titleDiv = document.createElement('div');
    titleDiv.style.flex = 'none';
    titleDiv.style.fontSize = '28px';
    titleDiv.style.paddingBottom = '16px';
    titleDiv.innerHTML = title;
    layer.appendChild(titleDiv);
  }
  if (description) {
    const descriptionDiv = document.createElement('div');
    descriptionDiv.style.flex = 'none';
    descriptionDiv.style.fontSize = '13px';
    descriptionDiv.style.color = '#8e8e8e';
    descriptionDiv.innerHTML = description;
    descriptionDiv.style.paddingBottom = '16px';
    layer.appendChild(descriptionDiv);
  }
  const canvas = document.createElement('div');
  canvas.style.flex = '1';
  layer.appendChild(canvas);
  return canvas;
}

/**
 * @public
 */
export class AutoChart {
  static async create(
    container: HTMLElement | string,
    data: any[] | Promise<any[]>,
    options?: AutoChartOptions
  ): Promise<AutoChart> {
    const containerDom = typeof container === 'string' ? document.getElementById(container) : container;
    if (!containerDom) throw new Error('please make sure canvas container is not null');
    let dataP: any[];
    if (Array.isArray(data)) {
      dataP = data;
    } else if (data instanceof Promise) {
      dataP = await data;
    } else {
      throw new TypeError('data type is error');
    }
    if (!dataP || !Array.isArray(dataP)) {
      throw new TypeError('data type is error');
    }
    let inst: AutoChart;
    if (CACHES.get(containerDom)) {
      inst = CACHES.get(containerDom) as AutoChart;
      // 如果配置和数据一样 不渲染直接返回
      if (isEqual(inst.options, options) && isEqual(inst.data, data)) return inst;
    } else {
      inst = new AutoChart(containerDom);
      CACHES.set(containerDom, inst);
    }
    return await inst.setup(dataP, options);
  }

  private container!: HTMLElement;
  private rendered = false;
  private noDataLayer: HTMLDivElement;
  private canvasLayer: HTMLDivElement | undefined;

  constructor(container: HTMLElement) {
    this.container = container;
    this.noDataLayer = createLayer(container, 'no-data-layer');
  }

  private development!: boolean;
  private data!: any[];
  private options: AutoChartOptions = {};
  private toolbar?: Toolbar;
  private configPanel?: ConfigPanel;
  private plot?: AutoPlot | DummyPlot;
  private noDataContent!: (container: HTMLDivElement) => void;
  private mockPanel?: MockPanel;
  private isMocked = false;

  async setup(data: any[], options?: AutoChartOptions) {
    if (this.rendered) this.destroy();
    this.rendered = true;
    // this.isMocked = false;
    this.options = options || {};
    const { fields, development, noDataContent } = this.options;
    if (!this.noDataLayer) this.noDataLayer = createLayer(this.container, 'no-data-layer');
    this.noDataContent = noDataContent || DEFAULT_FEEDBACK('暂无数据');
    this.data = fields && fields.length > 0 ? data.map((item) => pick(item, fields)) : data;
    this.development =
      (development === undefined && process.env.NODE_ENV === 'development') ||
      (development !== undefined && development === true);
    await this.render();
    return this;
  }

  async render() {
    const { options, container, development, noDataContent } = this;
    const { theme, toolbar, purpose, preferences, chartRuleConfigs, refine } = options;
    let { config } = options;
    if (this.data && this.data.length === 0) {
      if (development) {
        // 如果是在开发模式下 等待用户mock的数据和配置
        const mockPanel = new MockPanel(container);
        this.mockPanel = mockPanel;
        // this.isMocked = true;
        const result = await mockPanel.ps;
        this.data = result.data;
        config = result.config;
        this.mockPanel.destroy();
      } else {
        noDataContent(this.noDataLayer);
        return;
      }
    }

    this.canvasLayer = createLayer(this.container, 'canvas-layer');
    this.canvasLayer.style.pointerEvents = 'auto';
    const chartCanvas = addCanvas(this.canvasLayer, options);
    if (config) {
      if (typeof config.type !== 'string') throw new Error('please set the plotType');
      this.plot = new DummyPlot(chartCanvas, this.data, config);
    } else {
      // 获取上次渲染的advise 和 index
      let oldAdvices: Advice[] = [];
      let oldIndex = 0;
      if (this.plot instanceof AutoPlot) {
        oldAdvices = this.plot.advices;
        oldIndex = this.plot.current;
      }
      this.plot = new AutoPlot(
        chartCanvas,
        this.data,
        { theme, purpose, preferences, chartRuleConfigs, refine },
        oldAdvices,
        oldIndex
      );

      if (toolbar && this.plot.advices.length > 0) {
        this.toolbar = new Toolbar(this.plot, this.container);
      }
    }
    if (development && this.plot.plot) {
      this.configPanel = new ConfigPanel(this.plot, this.isMocked, this.container);
    }
  }

  /**
   * 清除上次渲染遗留的元素
   */
  destroy() {
    if (this.container.contains(this.noDataLayer)) {
      this.container.removeChild(this.noDataLayer);
    }
    if (this.configPanel) this.configPanel.destroy();
    if (this.toolbar) this.toolbar.destroy();
    if (this.plot) this.plot.destroy();
    if (this.canvasLayer) {
      this.container.removeChild(this.canvasLayer);
      this.canvasLayer = undefined;
    }
    if (this.mockPanel) this.mockPanel.destroy();
  }

  /**
   * 获得 Plot 对象信息
   */
  getPlot() {
    return this.plot;
  }
}
