import { CLASS_PREFIX } from './style';
import { PATH_PREFIX } from './constants';
import { AutoPlot } from './auto-plot';
import { DummyPlot } from './dummy-plot';
import { translate, getPosition } from './util';
import { DevPanel } from './dev-panel';
import { intl } from './i18n';

const SEND_CONFIGS = '__advisor__.send_configs';
const CONFIGS_CHANGE = '__advisor__.configs_change';

export class ConfigPanel {
  /**
   * config panel 的按钮
   */
  trigger: HTMLDivElement = document.createElement('div');

  /**
   * 图表容器
   */
  chartContainer: HTMLElement;

  /**
   * iframe
   */
  iframe: HTMLIFrameElement = document.createElement('iframe');

  /**
   * 是否以销毁
   */
  destroyed = false;

  /**
   * 容器关联的图表
   */
  plotInst: AutoPlot | DummyPlot;

  /**
   * 是不是需要拷贝数据的按钮
   */
  needCopyData: boolean;

  /**
   * 配置面板
   */
  panel?: DevPanel;

  private messageHandler = (e: MessageEvent) => {
    const { uuid, plot } = this.plotInst;
    if (e.data && e.data.type === CONFIGS_CHANGE && e.data.uuid === uuid) {
      if (plot) {
        plot.update(e.data.configs);
        plot.render();
      }
    }
  };

  private mouseEnterHandler = () => {
    this.trigger.style.display = 'block';
  };

  private mouseLeaveHandler = () => {
    this.trigger.style.display = 'none';
  };

  constructor(plotInst: AutoPlot | DummyPlot, needCopyData: boolean, container: HTMLElement) {
    this.plotInst = plotInst;
    this.needCopyData = needCopyData;
    this.chartContainer = container;
    container.addEventListener('mouseenter', this.mouseEnterHandler);
    container.addEventListener('mouseleave', this.mouseLeaveHandler);
    this.initIframe();
    this.initTrigger();
    container.appendChild(this.trigger);
    this.changeType();
  }

  initTrigger() {
    const { trigger, iframe } = this;
    trigger.innerHTML = '<img src="https://gw.alipayobjects.com/zos/antfincdn/zKMUjshkQt/config.png" />';
    trigger.className = `${CLASS_PREFIX}dev_btn ${CLASS_PREFIX}config_btn`;
    trigger.addEventListener('click', () => {
      if (!this.panel) {
        this.panel = new DevPanel({
          title: intl.get('Chart Config'),
          height: 534,
          width: 340,
          ...getPosition(this.chartContainer),
          visible: true,
          content: iframe,
        });
      } else {
        this.panel.toggle();
      }
    });
  }

  initIframe() {
    const { iframe, plotInst } = this;
    iframe.addEventListener('load', () => {
      const { currentConfigs, uuid } = plotInst;
      const message = {
        uuid,
        configs: currentConfigs,
        type: SEND_CONFIGS,
      };
      iframe!.contentWindow!.postMessage(message, '*');
    });
    window.addEventListener('message', this.messageHandler);
    if (plotInst instanceof AutoPlot) {
      plotInst.on('change', () => {
        this.changeType();
      });
    }
  }

  /**
   * 销毁实例
   */
  destroy() {
    const { chartContainer, trigger, panel, destroyed } = this;
    if (destroyed) return;
    if (panel) panel.destroy();
    chartContainer.removeChild(trigger);
    chartContainer.removeEventListener('mouseenter', this.mouseEnterHandler);
    chartContainer.removeEventListener('mouseleave', this.mouseLeaveHandler);
    window.removeEventListener('message', this.messageHandler);
    this.destroyed = true;
  }

  /**
   * 响应面板类型变更
   */
  changeType() {
    const { type } = this.plotInst;
    if (type)
      this.iframe.src = `${PATH_PREFIX}/config-panel.html?type=${translate(type)}&cancopydata=${this.needCopyData}`;
  }
}
