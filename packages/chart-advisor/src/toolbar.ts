import { CLASS_PREFIX } from './style';
import { Advice } from './advice-pipeline';
import { getElementDispay } from './util';
import { AutoPlot } from './auto-plot';
import Thumbnails from '@antv/thumbnails';

function getThumbnailURL(chartId: string) {
  // @ts-ignore
  if (Thumbnails[chartId] && Thumbnails[chartId].url) {
    // @ts-ignore
    return Thumbnails[chartId].url;
  }

  return 'https://gw.alipayobjects.com/zos/antfincdn/lP6YFnCEjy/nochartimg.svg';
}

function getAdvicesHtml(advices: Advice[]) {
  const top3 = advices.slice(0, 3);
  return top3
    .map((item, i) => {
      return `<div class="${CLASS_PREFIX}advice" data-index="${i}">
        <div>Top ${i + 1}</div>
        <div>
          <img src="${getThumbnailURL(item.type)}" />
        </div>
        <div>
          <div>${item.type}</div>
          <div>Score: ${`${item.score}`.slice(0, 4)}</div>
        </div>
      </div>`;
    })
    .join('');
}

const TOOLBAR_HTML = `
<div data-id="chart-type-btn" class="${CLASS_PREFIX}chart_type_btn">
  <img src="https://gw.alipayobjects.com/zos/basement_prod/4530bc52-9f00-46f8-afac-3c438ed1337a.svg" />
</div>
<div data-id="advices" class="${CLASS_PREFIX}advice_container"></div>
`;

export class Toolbar {
  /**
   * toolbar
   */
  private toolbar: HTMLDivElement;

  /**
   * 图表容器
   */
  private chartContainer: HTMLElement;

  /**
   * 图表切换器
   */
  private advicesContainer: HTMLDivElement;

  private mouseEnterHandler = () => {
    this.toolbar.style.display = 'block';
  };

  private mouseLeaveHandler = () => {
    this.toolbar.style.display = 'none';
  };

  destroyed = false;

  plotInst: AutoPlot;

  constructor(plotInst: AutoPlot) {
    const { container } = plotInst;
    this.plotInst = plotInst;
    this.chartContainer = container;
    container.addEventListener('mouseenter', this.mouseEnterHandler);
    container.addEventListener('mouseleave', this.mouseLeaveHandler);
    const toolbar = document.createElement('div');
    this.toolbar = toolbar;
    toolbar.className = `${CLASS_PREFIX}toolbar`;
    toolbar.innerHTML = TOOLBAR_HTML;
    this.advicesContainer = toolbar.querySelector('[data-id="advices"]') as HTMLDivElement;
    // 绑定事件
    toolbar.addEventListener('click', (e: MouseEvent) => {
      const { advicesContainer } = this;
      if (e && e.target) {
        const target = e.target as HTMLElement;
        if (target.getAttribute('data-id') === 'chart-type-btn') {
          advicesContainer.style.display = getElementDispay(advicesContainer) === 'none' ? 'block' : 'none';
        } else {
          const dataIndex = target.getAttribute('data-index');
          if (dataIndex) {
            this.plotInst.render(Number.parseInt(dataIndex, 10));
          }
        }
      }
    });
    this.render();
  }

  render() {
    const { advices } = this.plotInst;
    this.advicesContainer.innerHTML = getAdvicesHtml(advices);
    this.chartContainer.appendChild(this.toolbar);
  }

  destroy() {
    const { chartContainer, mouseEnterHandler, mouseLeaveHandler, toolbar, destroyed } = this;
    if (destroyed) return;
    chartContainer.removeEventListener('mouseenter', mouseEnterHandler);
    chartContainer.removeEventListener('mouseleave', mouseLeaveHandler);
    chartContainer.removeChild(toolbar);
    this.destroyed = true;
  }
}
