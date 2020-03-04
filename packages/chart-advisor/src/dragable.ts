/**
 * 让元素可以拖动改变位置
 * @param target - 需要拖动的元素
 */
export default function dragable(target: HTMLElement) {
  const handlers: ((event: MouseEvent) => void)[] = [];

  target.onmousedown = function(event: MouseEvent) {
    const shiftX = event.clientX - target.getBoundingClientRect().left;
    const shiftY = event.clientY - target.getBoundingClientRect().top;
    const mask = target.querySelector('[data-id="mask"]') as HTMLDivElement;
    function moveAt(pageX: number, pageY: number) {
      target.style.left = pageX - shiftX + 'px';
      target.style.top = pageY - shiftY + 'px';
    }

    moveAt(event.pageX, event.pageY);

    function onMouseMove(event: MouseEvent) {
      mask.style.zIndex = '10';
      moveAt(event.pageX, event.pageY);
    }

    handlers.push(onMouseMove);

    // move the ball on mousemove
    document.addEventListener('mousemove', onMouseMove);

    // drop the ball, remove unneeded handlers
    target.onmouseup = function() {
      handlers.forEach((item) => {
        document.removeEventListener('mousemove', item);
      });
      mask.style.zIndex = '-1';
      target.onmouseup = null;
    };
  };

  target.ondragstart = function() {
    return false;
  };
}
