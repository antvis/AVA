import { Canvg } from 'canvg';

export type ImageExtra = {
  jumpUrl?: string 
}

const isNegativeArrow = (svgElement: SVGSVGElement) => {
  return svgElement?.parentElement?.className.includes('ntv-value-negative');
};

const isPositiveArrow = (svgElement: SVGSVGElement) => {
  return svgElement.parentElement?.className.includes('ntv-value-positive');
};

/** 用于控制显隐的 eye icon 不复制 */
const isEyeIcon = (svgElement: SVGSVGElement) => {
  return (
    svgElement.parentElement?.className.includes('anticon-eye') ||
    svgElement.parentElement?.className.includes('anticon-eye-invisible')
  );
};

/** 上下箭头替换成正负号 */
const transformArrowToText = (svgElement: SVGSVGElement, html: string) => {
  let newHtml = html;
  const svgHtml = svgElement.outerHTML;
  if (isNegativeArrow(svgElement)) {
    newHtml = newHtml.replace(svgHtml, '-');
  }
  if (isPositiveArrow(svgElement)) {
    newHtml = newHtml.replace(svgHtml, '+');
  }
  return newHtml;
};

/** 
 * 获取 svg 元素渲染 img 的 url
 */
const svgToPngUrl = async (data: { width?: number; height?: number; svg: string }, canvas: HTMLCanvasElement) => {
  const { svg } = data;
  const ctx = canvas?.getContext('2d');
  if (ctx) {
    const v = await Canvg.from(ctx, svg);
    await v.render();
  }

  const pngUrl = canvas?.toDataURL();
  return pngUrl;
};

const svgToImageHtml = async (svgElement: SVGSVGElement, svgHtml: string, canvas: HTMLCanvasElement) => {
  const width = svgElement.getBBox().width;
  const height = svgElement.getBBox().height;
  const imageUrl = await svgToPngUrl({ width, height, svg: svgHtml }, canvas);
  const imageHtml = `<img src="${imageUrl}" width="${width}" height="${height}"/>`;
  return imageHtml
}

const canvasToImageHtml = (canvasElement: HTMLCanvasElement, imgExtra: ImageExtra) => {
  const pngUrl = canvasElement.toDataURL();
  const width = canvasElement.width;
  const height = canvasElement.height;
  const baseImageHtml = `<img src="${pngUrl}" width="${width}" height="${height}" />`;
  const imageHtml = imgExtra?.jumpUrl
    ? `<a href="${imgExtra.jumpUrl}">${baseImageHtml}</a>`
    : baseImageHtml;
  return imageHtml
}

/**
 * 获取 html 元素的内容，并转换为可以复制粘贴的 html string
 */
export const transformHtml = async ({elements = [], imageExtra, replaceType = 'image'}: {
  elements: HTMLCollectionOf<Element> | HTMLElement[];
  replaceType?: 'image' | 'text' | 'none';
  imageExtra?: ImageExtra,
}) => {
  let originalHtml = '';
  for (let i = 0; i < elements.length; i++) {
    const element = (elements as HTMLCollectionOf<Element>).item?.(i) || elements?.[i];
    originalHtml += element?.outerHTML;
  }
  let newHtml = originalHtml;
  const canvasForCopy = document.createElement('canvas');
  for (let i = 0; i < elements.length; i++) {
    const element = elements[i];
    const svgElements = element.getElementsByTagName('svg');
    const canvasElements = element.getElementsByTagName('canvas');
    for (let k = 0; k < canvasElements.length; k++) {
      const canvasElement = canvasElements[k]
      const elemHtml = canvasElement.outerHTML;
      if (replaceType === 'image') {
        const imageHtml = canvasToImageHtml(canvasElement, imageExtra);
        newHtml = newHtml.replace(elemHtml, imageHtml);
      }
    }
    for (let j = 0; j < svgElements.length; j++) {
      const svgElement = svgElements[j]
      const svgHtml = svgElement.outerHTML;
      if (replaceType === 'image') {
        if (isNegativeArrow(svgElement) || isPositiveArrow(svgElement)) {
          // 因为箭头 svg 转图片有点问题，所以先转 text
          newHtml = transformArrowToText(svgElement, newHtml);
        } else if (!isEyeIcon(svgElement)) {
          const imageHtml = await svgToImageHtml(svgElement, svgHtml, canvasForCopy)
          newHtml = newHtml.replace(svgHtml, imageHtml);
        }
      } else if (replaceType === 'text') {
        newHtml = transformArrowToText(svgElements[j], newHtml);
      }
    }
  }

  return newHtml;
};
