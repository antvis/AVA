/**
 * create plots unit test wrapper
 * @param title add unit test title
 * @param container parentNode default document.body
 * @returns dom for wrapper, main and title
 */
export function createWrapper(title: string = '', container: HTMLElement = document.body): HTMLElement[] {
  // wrapper div for layout
  const wrapperDiv = document.createElement('div');
  wrapperDiv.style.padding = '12px';

  // main div for draw canvas
  const mainDiv = document.createElement('div');

  // title p for title
  const titleDiv = document.createElement('p');
  titleDiv.style.textAlign = 'center';
  titleDiv.appendChild(document.createTextNode(title));

  // append
  wrapperDiv.appendChild(titleDiv);
  wrapperDiv.appendChild(mainDiv);
  container.appendChild(wrapperDiv);

  return [wrapperDiv, mainDiv, titleDiv];
}

/**
 * 移除 dom 元素
 * @param dom
 */
export function removeDom(dom: HTMLElement) {
  const parent = dom.parentNode;

  if (parent) {
    parent.removeChild(dom);
  }
}
