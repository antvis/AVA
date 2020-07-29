import { max, min, zip, unzip } from 'underscore';

export class Normalizer {
  public normalizedPoints: any[];
  public points: any[];
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

export function Binner(this: any) {
  const thirdPi = Math.PI / 3,
    angles = [0, thirdPi, 2 * thirdPi, 3 * thirdPi, 4 * thirdPi, 5 * thirdPi];

  function pointX(d: any) {
    return d[0];
  }

  function pointY(d: any) {
    return d[1];
  }

  let x0 = 0,
    y0 = 0,
    x1 = 1,
    y1 = 1,
    x = pointX,
    y = pointY,
    r: number,
    dx: number,
    dy: number;

  function hexbin(points: any) {
    let binsById = {},
      bins = [],
      i,
      n = points.length,
      px,
      py;

    for (i = 0; i < n; ++i) {
      let point;

      px = +x.call(null, (point = points[i]));
      py = +y.call(null, point);

      if (isNaN(px) || isNaN(py)) continue;

      let pj = Math.round((py = py / dy)),
        pi = Math.round((px = px / dx - (pj & 1) / 2)),
        py1 = py - pj;

      if (Math.abs(py1) * 3 > 1) {
        let px1 = px - pi,
          pi2 = pi + (px < pi ? -1 : 1) / 2,
          pj2 = pj + (py < pj ? -1 : 1),
          px2 = px - pi2,
          py2 = py - pj2;
        if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) (pi = pi2 + (pj & 1 ? 1 : -1) / 2), (pj = pj2);
      }

      let id = pi + '-' + pj,
        bin: any;
      if (bin) bin.push(point);
      else {
        bins.push((bin = [point]));
        bin.x = (pi + (pj & 1) / 2) * dx;
        bin.y = pj * dy;
      }
    }

    return bins;
  }

  function hexagon(radius: any) {
    let x0 = 0,
      y0 = 0;

    return angles.map(function(angle) {
      const x1 = Math.sin(angle) * radius,
        y1 = -Math.cos(angle) * radius,
        dx = x1 - x0,
        dy = y1 - y0;
      (x0 = x1), (y0 = y1);

      return [dx, dy];
    });
  }

  this.hexbin = hexbin;

  this.hexagon = function(radius: any) {
    return 'm' + hexagon(radius == null ? r : +radius).join('l') + 'z';
  };

  this.centers = function() {
    let centers = [],
      j = Math.round(y0 / dy),
      i = Math.round(x0 / dx);

    for (let y = j * dy; y < y1 + r; y += dy, ++j) {
      for (let x = i * dx + ((j & 1) * dx) / 2; x < x1 + dx / 2; x += dx) {
        centers.push([x, y]);
      }
    }

    return centers;
  };

  this.centers = function() {
    let centers = [],
      j = Math.round(y0 / dy),
      i = Math.round(x0 / dx);
      
    for (let y = j * dy; y < y1 + r; y += dy, ++j) {
      for (let x = i * dx + ((j & 1) * dx) / 2; x < x1 + dx / 2; x += dx) {
        centers.push([x, y]);
      }
    }

    return centers;
  };

  this.mesh = function() {
    const fragment = hexagon(r)
      .slice(0, 4)
      .join('l');
      
    return this.centers()
      .map(function(p: any) {
        return 'M' + p + 'm' + fragment;
      })
      .join('');
  };

  this.x = function(_: (d: any) => any) {
    return arguments.length ? ((x = _), this) : x;
  };

  this.y = function(_: (d: any) => any) {
    return arguments.length ? ((y = _), this) : y;
  };

  this.radius = function(_: string | number) {
    return arguments.length ? ((r = +_), (dx = r * 2 * Math.sin(thirdPi)), (dy = r * 1.5), this) : r;
  };

  this.size = function(_: (string | number)[]) {
    return arguments.length ? ((x0 = y0 = 0), (x1 = +_[0]), (y1 = +_[1]), this) : [x1 - x0, y1 - y0];
  };

  this.extent = function(_: (string | number)[][]) {
    return arguments.length
      ? ((x0 = +_[0][0]), (y0 = +_[0][1]), (x1 = +_[1][0]), (y1 = +_[1][1]), this)
      : [
          [x0, y0],
          [x1, y1],
        ];
  };

  return this.radius(1);
}
