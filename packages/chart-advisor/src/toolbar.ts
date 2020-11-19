import { CLASS_PREFIX } from './style';
import { Advice, specToLibConfig } from './advice-pipeline';
import { getElementDisplay } from './util';
import { AutoPlot } from './auto-plot';
import Thumbnails from '@antv/thumbnails';
import { CKBJson } from '@antv/knowledge';

const ChartWiki = CKBJson('zh-CN', true);

function getThumbnailURL(chartId: string) {
  // @ts-ignore
  if (Thumbnails[chartId] && Thumbnails[chartId].url) {
    // @ts-ignore
    return Thumbnails[chartId].url;
  }

  return 'https://gw.alipayobjects.com/zos/antfincdn/lP6YFnCEjy/nochartimg.svg';
}
const rankIcons = [
  'https://gw.alipayobjects.com/zos/antfincdn/61FtDvdTVl/no1.png',
  'https://gw.alipayobjects.com/zos/antfincdn/Y7AsvjRWNF/no2.png',
  'https://gw.alipayobjects.com/zos/antfincdn/2%24ruKwktmY/no3.png',
];

function getAdvicesHtml(advices: Advice[]) {
  const top3 = advices.filter((advice) => specToLibConfig(advice)).slice(0, 3);
  const rankContent = top3
    .map((item, i) => {
      return `<div class="${CLASS_PREFIX}advice" data-index="${i}">
        <div class="${CLASS_PREFIX}advice-thumbnail" data-index="${i}">
          <img src="${getThumbnailURL(item.type)}" data-index="${i}" />
        </div>
        <div class="${CLASS_PREFIX}advice-desc" data-index="${i}">
          <img src="${rankIcons[i]}" data-index="${i}"/>
          <div class="advice-chart-name" data-index="${i}" >${ChartWiki[item.type].name}</div>
          <div class="advice-score-text" data-index="${i}" >推荐分 <span class="advice-score">${item.score.toFixed(
        2
      )}</span></div>
        </div>
      </div>`;
    })
    .join('');
  return `
    <div class="${CLASS_PREFIX}advice_content">
    ${rankContent}
      </div>
    </div>
    <div class="${CLASS_PREFIX}advice_content_arrow">
  `;
}

const TOOLBAR_HTML = `
<div data-id="chart-type-btn" class="${CLASS_PREFIX}config_btn">
  <img src="https://gw.alipayobjects.com/zos/antfincdn/krFnwF2VZi/retweet.png" />
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

  constructor(plotInst: AutoPlot, container: HTMLElement) {
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
          advicesContainer.style.display = getElementDisplay(advicesContainer) === 'none' ? 'block' : 'none';
        } else {
          console.log(111);
          const dataIndex = target.getAttribute('data-index');
          console.log(dataIndex);
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
