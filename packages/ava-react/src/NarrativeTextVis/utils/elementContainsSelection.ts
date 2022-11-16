function isOrContains(node: Node | null, container: HTMLElement) {
  while (node) {
    if (node === container) {
      return true;
    }
    // eslint-disable-next-line no-param-reassign
    node = node.parentNode;
  }
  return false;
}
/**
 * 判断选区是否在指定元素内
 */
export function elementContainsSelection(el: HTMLElement) {
  let sel: Selection | null;
  if (window.getSelection) {
    sel = window.getSelection();
    if (sel?.rangeCount > 0) {
      for (let i = 0; i < sel?.rangeCount; i += 1) {
        if (!isOrContains(sel?.getRangeAt(i)?.commonAncestorContainer, el)) {
          return false;
        }
      }
      return true;
    }
    // @ts-ignore
    // eslint-disable-next-line no-cond-assign
  } else if ((sel = document?.selection) && sel?.type !== 'Control') {
    // @ts-ignore
    return isOrContains(sel?.createRange()?.parentElement(), el);
  }
  return false;
}
