import { CLASS_PREFIX } from './style';

export class EmptyContent {
  chartContainer: HTMLElement;
  content: HTMLDivElement;
  rendered = false;
  destroyed = false;
  constructor(container: HTMLElement) {
    this.chartContainer = container;
    this.content = document.createElement('div');
    this.content.className = `${CLASS_PREFIX}no_data_content`;
  }
  render() {
    this.rendered = true;
    this.content.innerHTML = `
      <div style="margin-bottom: 16px;">
        <img src="https://gw.alipayobjects.com/zos/basement_prod/9a59280d-8f23-4234-b5cf-02956a91b6ff.svg" />
      </div>
      <div>暂无数据</div>
    `;
    this.chartContainer.appendChild(this.content);
  }
  destroy(_container: HTMLElement) {
    const { rendered, destroyed, chartContainer, content } = this;
    if (!rendered || destroyed) return;
    chartContainer.removeChild(content);
    this.destroyed = true;
  }
}
