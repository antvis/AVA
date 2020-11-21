import { CLASS_PREFIX } from './style';
import dragable from './dragable';

export interface PanelOptions {
  title: string;
  height: number;
  width: number;
  top: number;
  left: number;
  visible: boolean;
  content: string | HTMLIFrameElement;
}

export class DevPanel {
  /**
   * panel 的容器
   */
  containerEl: HTMLDivElement = document.createElement('div');

  destroyed = false;

  options: PanelOptions;

  visible: boolean;

  protected panelEl!: HTMLDivElement;

  protected contentEl!: HTMLDivElement;

  constructor(options: PanelOptions) {
    this.options = options;
    const { title, width, height, content, visible, top, left } = options;
    const { containerEl } = this;
    this.visible = visible;
    const display = visible ? 'block' : 'none';
    containerEl.innerHTML = `
    <div data-id="panel" class="${CLASS_PREFIX}dev_panel" style="height: ${height}px; width: ${width}px; display: ${display}; top: ${top}px; left: ${left}px;">
      <div data-id="mask" class="${CLASS_PREFIX}dev_panel_mask"></div>
      <header>${title}<span data-id="close" class="${CLASS_PREFIX}dev_panel_close">x</span></header>
      <div data-id="content" class="${CLASS_PREFIX}dev_panel_content"></div>
    </div>
    `;
    const panelEl = (this.panelEl = containerEl.querySelector('[data-id="panel"]') as HTMLDivElement);
    const contentEl = (this.contentEl = containerEl.querySelector('[data-id="content"]') as HTMLDivElement);
    if (typeof content === 'string') contentEl.innerHTML = content;
    else contentEl.appendChild(content);
    const closeEl = containerEl.querySelector('[data-id="close"]') as HTMLSpanElement;
    closeEl.addEventListener('click', () => {
      this.hide();
    });
    dragable(panelEl);
    document.body.appendChild(this.containerEl);
  }

  /**
   * 销毁实例
   */
  destroy() {
    const { destroyed, containerEl } = this;
    if (destroyed) return;
    document.body.removeChild(containerEl);
    this.destroyed = true;
  }

  show() {
    this.panelEl.style.display = 'block';
    this.visible = true;
  }

  hide() {
    this.panelEl.style.display = 'none';
    this.visible = false;
  }

  toggle() {
    if (this.visible) this.hide();
    else this.show();
  }
}
