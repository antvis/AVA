import { max, min, zip, unzip } from 'underscore';

export class Normalizer {
  normalizedPoints: any[];
  points: any[];
  dataX: any;
  dataY: any;
  maxX: number;
  minX: number;
  maxY: number;
  minY: number;
  rangeX: number;
  rangeY: number;
  normalizedX: number[];
  normalizedY: number[];

  constructor(points: any[]) {
    this.points = points.slice(0);
    const [dataX, dataY] = ([this.dataX, this.dataY] = unzip(this.points));

    const maxX = (this.maxX = max(dataX)),
      minX = (this.minX = min(dataX)),
      maxY = (this.maxY = max(dataY)),
      minY = (this.minY = min(dataY)),
      rangeX = (this.rangeX = maxX != minX ? maxX - minX : 1),
      rangeY = (this.rangeY = maxY != minY ? maxY - minY : 1),
      normalizedX = (this.normalizedX = dataX.map((x) => (x - minX) / rangeX)),
      normalizedY = (this.normalizedY = dataY.map((y) => (y - minY) / rangeY));

    this.normalizedPoints = zip(normalizedX, normalizedY);

    const length = this.points.length;
    for (let i = 0; i < length; i++) {
      this.normalizedPoints[i].data = this.points[i].data;
    }
  }

  normToPlot(points: any[]) {
    const oriplot = points.map((p) => {
      return this.normToPoint(p);
    });

    return oriplot;
  }

  normToPoint(point: any) {
    const midx = point[0],
      midy = point[1];

    const orix = this.minX + this.rangeX * midx,
      oriy = this.minY + this.rangeY * midy;

    return [orix, oriy];
  }
}

export function isA2DLine(points: any) {
  const x1 = points[0][0];
  const y1 = points[0][1];
  const x2 = points[1][0];
  const y2 = points[1][1];

  for (let i = 2; i < points.length; i++) {
    const x3 = points[i][0];
    const y3 = points[i][1];

    if ((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1) !== 0) {
      return false;
    }
  }

  return true;
}

export class Binner {
  points: any[];
  angles: number[];
  thirdPi: number;
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  r: number;
  dx: number;
  dy: number;

  constructor(points: any, radius: number) {
    this.points = points;

    const thirdPi = Math.PI / 3;
    this.angles = [0, thirdPi, 2 * thirdPi, 3 * thirdPi, 4 * thirdPi, 5 * thirdPi];
    this.thirdPi = thirdPi;

    this.x0 = 0;
    this.y0 = 0;
    this.x1 = 1;
    this.y1 = 1;

    this.r = 0;
    this.dx = 0;
    this.dy = 0;

    this.radius(radius);

    this.extent([
      [0, 0],
      [1, 1],
    ]);
  }

  pointX(d: any) {
    return d[0];
  }

  pointY(d: any) {
    return d[1];
  }

  hexbin() {
    const points = this.points;

    const bins = [],
      n = points.length;

    let i, px, py;

    for (i = 0; i < n; ++i) {
      let point;

      px = +this.pointX.call(null, (point = points[i]));
      py = +this.pointY.call(null, point);

      if (isNaN(px) || isNaN(py)) continue;

      let pj = Math.round((py = py / this.dy)),
        pi = Math.round((px = px / this.dx - (pj & 1) / 2));
      const py1 = py - pj;

      if (Math.abs(py1) * 3 > 1) {
        const px1 = px - pi,
          pi2 = pi + (px < pi ? -1 : 1) / 2,
          pj2 = pj + (py < pj ? -1 : 1),
          px2 = px - pi2,
          py2 = py - pj2;
        if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) (pi = pi2 + (pj & 1 ? 1 : -1) / 2), (pj = pj2);
      }

      let bin: any;
      if (bin) bin.push(point);
      else {
        bins.push((bin = [point]));
        bin.x = (pi + (pj & 1) / 2) * this.dx;
        bin.y = pj * this.dy;
      }
    }

    return bins;
  }

  hexagonal(radius: any) {
    let x0 = 0,
      y0 = 0;

    return this.angles.map(function(angle) {
      const x1 = Math.sin(angle) * radius,
        y1 = -Math.cos(angle) * radius,
        dx = x1 - x0,
        dy = y1 - y0;
      (x0 = x1), (y0 = y1);

      return [dx, dy];
    });
  }

  hexagon(radius: any) {
    return 'm' + this.hexagonal(radius == null ? this.r : +radius).join('l') + 'z';
  }

  centers() {
    const centers = [];
    let j = Math.round(this.y0 / this.dy);
    const i = Math.round(this.x0 / this.dx);

    for (let y = j * this.dy; y < this.y1 + this.r; y += this.dy, ++j) {
      for (let x = i * this.dx + ((j & 1) * this.dx) / 2; x < this.x1 + this.dx / 2; x += this.dx) {
        centers.push([x, y]);
      }
    }

    return centers;
  }

  mesh() {
    const fragment = this.hexagonal(this.r)
      .slice(0, 4)
      .join('l');

    return this.centers()
      .map(function(p: any) {
        return 'M' + p + 'm' + fragment;
      })
      .join('');
  }

  x(_: (d: any) => any) {
    return arguments.length ? ((this.pointX = _), this) : this.pointX;
  }

  y(_: (d: any) => any) {
    return arguments.length ? ((this.pointY = _), this) : this.pointY;
  }

  radius(_: string | number) {
    let r = this.r;

    return arguments.length ? ((r = +_), (this.dx = r * 2 * Math.sin(this.thirdPi)), (this.dy = r * 1.5), this) : r;
  }

  size(_: (string | number)[]) {
    let x0 = this.x0;
    let y0 = this.y0;
    let x1 = this.x1;
    let y1 = this.y1;

    return arguments.length ? ((x0 = y0 = 0), (x1 = +_[0]), (y1 = +_[1]), this) : [x1 - x0, y1 - y0];
  }

  extent(_: (string | number)[][]) {
    let x0 = this.x0;
    let y0 = this.y0;
    let x1 = this.x1;
    let y1 = this.y1;

    return arguments.length
      ? ((x0 = +_[0][0]), (y0 = +_[0][1]), (x1 = +_[1][0]), (y1 = +_[1][1]), this)
      : [
          [x0, y0],
          [x1, y1],
        ];
  }
}
