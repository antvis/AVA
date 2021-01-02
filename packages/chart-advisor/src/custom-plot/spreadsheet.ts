import { removeAllChild } from '../util';

export class Spreadsheet {
  readonly container: HTMLElement;
  readonly data: Record<string, any>[];
  constructor(container: HTMLElement, data: Record<string, any>[]) {
    this.container = container;
    this.data = data;
  }
  render() {
    this.destroy();
    this.container.innerText = 'autoChart 暂不支持渲染';
  }
  update() {}
  destroy() {
    removeAllChild(this.container);
  }
}
