import { useState, useEffect } from 'react';
import { scaleLinear, Scale } from './scaleLinear';
import { DEFAULT_FONT_SIZE } from '../hooks/getElementFontSize';

// adjust to draw line width
const SCALE_ADJUST = 2;

class Line {
  protected data: number[] = [];
  protected size = DEFAULT_FONT_SIZE;
  protected height = this.size;
  protected width = this.getWidth();
  protected xScale: Scale | undefined;
  protected yScale: Scale | undefined;
  protected points: [number, number][] = [];

  constructor(size: number, data: number[]) {
    this.size = size;
    this.data = data;
    this.compute();
  }

  protected getWidth() {
    return Math.max(this.size * 2, this.data?.length * 2);
  }

  protected compute() {
    if (!this.data) return;
    this.height = this.size;
    this.width = this.getWidth();
    this.xScale = scaleLinear([0, this.width], [0, this.data?.length - 1]);
    const [min, max] = [Math.min(...this.data), Math.max(...this.data)];
    this.yScale = scaleLinear([SCALE_ADJUST, this.height - SCALE_ADJUST], [min, max]);
    this.points = this.data.map((item, index) => [this.xScale?.(index), this.height - this.yScale?.(item)]);
  }

  getLinePath(): null | string {
    if (!this.data?.length || !this.xScale || !this.yScale) return null;
    const path = this.points.reduce((prev, [x, y], index) => {
      if (index === 0) return `M${x} ${y}`;
      return `${prev} L ${x} ${y}`;
    }, '');
    return path;
  }

  getPolygonPath(): null | string {
    if (!this.data?.length || !this.xScale || !this.yScale) return null;
    const polygonPoints = [...this.points];
    const last = this.points[this.points.length - 1];
    polygonPoints.push([last[0], this.height]);
    polygonPoints.push([0, this.height]);
    const startPoint = this.points[0];
    polygonPoints.push(startPoint);

    const path = polygonPoints.reduce((prev, [x, y]) => `${prev} ${x},${y}`, '');
    return path;
  }

  getContainer() {
    return [this.width, this.height];
  }
}

export const useLineCompute = (size: number, data: number[]) => {
  const [line, setLine] = useState<Line>(new Line(size, data));
  useEffect(() => {
    setLine(new Line(size, data));
  }, [size, data]);
  return {
    width: line.getContainer()[0],
    height: line.getContainer()[1],
    linePath: line.getLinePath(),
    polygonPath: line.getPolygonPath(),
  };
};
