import { PATH_PREFIX } from './constants';
import { CLASS_PREFIX } from './style';
import { uuid, getPosition } from './util';
import { DevPanel } from './dev-panel';
import { intl } from './i18n';

const MOCK_CHART = '__advisor__.mock_chart';

interface Cache {
  resolve(result: any): void;
  reject(error: any): void;
}

const CALLBACKS: Map<string, Cache> = new Map();

window.addEventListener('message', (e) => {
  if (e.data && e.data.type === MOCK_CHART) {
    const { id, error, result } = e.data;
    const cache = CALLBACKS.get(id);
    if (cache) {
      const { reject, resolve } = cache;
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    }
  }
});

export class MockPanel {
  /**
   * config panel 的按钮
   */
  trigger: HTMLDivElement = document.createElement('div');

  /**
   * 图表容器
   */
  chartContainer: HTMLElement;

  // TODO modified g2plot chart type
  ps: Promise<{ config?: any; data: any[] }>;

  panel?: DevPanel;

  destroyed = false;

  constructor(container: HTMLElement) {
    const { trigger } = this;
    this.chartContainer = container;
    const id = uuid();
    this.ps = new Promise((resolve, reject) => {
      CALLBACKS.set(id, { resolve, reject });
    });

    trigger.className = `${CLASS_PREFIX}mock_guide`;
    trigger.innerHTML = `
      <div style="margin-bottom: 16px;">
        <img src="https://gw.alipayobjects.com/zos/basement_prod/9a59280d-8f23-4234-b5cf-02956a91b6ff.svg" />
      </div>
      <div>暂无数据</div>
      <div class="${CLASS_PREFIX}mock_guide_button">${intl.get('Initialization')}</div>
    `;
    trigger.addEventListener('click', () => {
      if (!this.panel) {
        this.panel = new DevPanel({
          title: intl.get('Initialization'),
          height: 616,
          width: 600,
          ...getPosition(container),
          visible: true,
          content: `<iframe src="${PATH_PREFIX}/mock-panel.html?id=${id}"></iframe>`,
        });
      } else {
        this.panel.toggle();
      }
    });
    container.appendChild(trigger);
  }

  /**
   * 销毁实例
   */
  destroy() {
    const { chartContainer, trigger, panel, destroyed } = this;
    if (destroyed) return;
    if (panel) panel.destroy();
    chartContainer.removeChild(trigger);
    this.destroyed = true;
  }
}
