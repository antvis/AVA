import { removeAllChild } from '../util';
import { CLASS_PREFIX } from '../style';
import { intl } from '../i18n';

export class Table {
  readonly container: HTMLElement;
  readonly data: Record<string, any>[];
  constructor(container: HTMLElement, data: Record<string, any>[]) {
    this.container = container;
    this.data = data;
  }
  render() {
    this.destroy();
    if (this.data.length > 0) {
      if (this.data.length < 100) {
        const keys = Object.keys(this.data[0]);
        const tableDom = document.createElement('table');
        tableDom.className = `${CLASS_PREFIX}-table`;

        // table head
        const thead = document.createElement('thead');
        const thead_tr = document.createElement('tr');
        for (const key of keys) {
          const th = document.createElement('th');
          th.innerText = key;
          thead_tr.appendChild(th);
        }
        thead.appendChild(thead_tr);

        // table body
        const tbody = document.createElement('tbody');
        for (const item of this.data) {
          const tbody_tr = document.createElement('tr');
          for (const key of keys) {
            const td = document.createElement('td');
            td.innerText = item[key];
            tbody_tr.appendChild(td);
          }
          tbody.appendChild(tbody_tr);
        }

        tableDom.appendChild(thead);
        tableDom.appendChild(tbody);

        this.container.appendChild(tableDom);
      } else {
        this.container.innerText = intl.get('The data is too big to support temporarily');
      }
    }
  }
  update() {}
  destroy() {
    removeAllChild(this.container);
  }
}
