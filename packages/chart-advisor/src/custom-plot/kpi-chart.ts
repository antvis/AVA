import { removeAllChild } from '../util';
import { CLASS_PREFIX } from '../style';

function generateCard(name: string, value: any) {
  const cardDom = document.createElement('div');
  cardDom.className = `${CLASS_PREFIX}kpi-chart-card`;

  const nameDom = document.createElement('div');
  nameDom.className = `${CLASS_PREFIX}kpi-chart-card-name`;
  cardDom.appendChild(nameDom);
  nameDom.innerText = name;

  const valueDOm = document.createElement('div');
  valueDOm.className = `${CLASS_PREFIX}kpi-chart-card-value`;
  valueDOm.innerText = value;
  cardDom.appendChild(valueDOm);
  return cardDom;
}

/**
 *  custom render kpi chart
 */
export class KPIPlot {
  readonly container: HTMLElement;
  readonly data: Record<string, any>;
  constructor(container: HTMLElement, data: Record<string, any>) {
    this.container = container;
    this.data = data;
  }
  render() {
    this.destroy();
    const wrapper = document.createElement('div');
    wrapper.className = `${CLASS_PREFIX}kpi-chart`;
    for (const key of Object.keys(this.data)) {
      wrapper.appendChild(generateCard(key, this.data[key]));
    }
    this.container.appendChild(wrapper);
  }
  update() {}
  destroy() {
    removeAllChild(this.container);
  }
}
