import _ from 'underscore';

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
    let [dataX, dataY] = ([this.dataX, this.dataY] = _.unzip(this.points));

    let maxX = (this.maxX = _.max(dataX)),
      minX = (this.minX = _.min(dataX)),
      maxY = (this.maxY = _.max(dataY)),
      minY = (this.minY = _.min(dataY)),
      rangeX = (this.rangeX = maxX != minX ? maxX - minX : 1),
      rangeY = (this.rangeY = maxY != minY ? maxY - minY : 1),
      normalizedX = (this.normalizedX = dataX.map((x) => (x - minX) / rangeX)),
      normalizedY = (this.normalizedY = dataY.map((y) => (y - minY) / rangeY));

    this.normalizedPoints = _.zip(normalizedX, normalizedY);

    let length = this.points.length;
    for (let i = 0; i < length; i++) {
      this.normalizedPoints[i].data = this.points[i].data;
    }
  }

  normToPlot(points: any[]) {
    let oriplot = points.map((p) => {
      return this.normToPoint(p);
    });

    return oriplot;
  }

  normToPoint(point: any) {
    let midx = point[0],
      midy = point[1];
    let orix = this.minX + this.rangeX * midx,
      oriy = this.minY + this.rangeY * midy;

    return [orix, oriy];
  }
}

export function isA2DLine(points: any) {
  let x1 = points[0][0];
  let y1 = points[0][1];
  let x2 = points[1][0];
  let y2 = points[1][1];

  for (let i = 2; i < points.length; i++) {
    let x3 = points[i][0];
    let y3 = points[i][1];
    if ((x2 - x1) * (y3 - y1) - (y2 - y1) * (x3 - x1) !== 0) {
      return false;
    }
  }

  return true;
}

export function Binner(this: any) {
  let thirdPi = Math.PI / 3,
    angles = [0, thirdPi, 2 * thirdPi, 3 * thirdPi, 4 * thirdPi, 5 * thirdPi];

  function pointX(d: any) {
    return d[0];
  }

  function pointY(d: any) {
    return d[1];
  }

  var x0 = 0,
    y0 = 0,
    x1 = 1,
    y1 = 1,
    x = pointX,
    y = pointY,
    r: number,
    dx: number,
    dy: number;

  function hexbin(points: any) {
    var binsById = {},
      bins = [],
      i,
      n = points.length;

    for (i = 0; i < n; ++i) {
      if (isNaN((px = +x.call(null, (point = points[i])))) || isNaN((py = +y.call(null, point)))) continue;

      var point,
        px,
        py,
        pj = Math.round((py = py / dy)),
        pi = Math.round((px = px / dx - (pj & 1) / 2)),
        py1 = py - pj;

      if (Math.abs(py1) * 3 > 1) {
        var px1 = px - pi,
          pi2 = pi + (px < pi ? -1 : 1) / 2,
          pj2 = pj + (py < pj ? -1 : 1),
          px2 = px - pi2,
          py2 = py - pj2;
        if (px1 * px1 + py1 * py1 > px2 * px2 + py2 * py2) (pi = pi2 + (pj & 1 ? 1 : -1) / 2), (pj = pj2);
      }

      var id = pi + '-' + pj,
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
    var x0 = 0,
      y0 = 0;
    return angles.map(function(angle) {
      var x1 = Math.sin(angle) * radius,
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
    var centers = [],
      j = Math.round(y0 / dy),
      i = Math.round(x0 / dx);
    for (var y = j * dy; y < y1 + r; y += dy, ++j) {
      for (var x = i * dx + ((j & 1) * dx) / 2; x < x1 + dx / 2; x += dx) {
        centers.push([x, y]);
      }
    }
    return centers;
  };

  this.centers = function() {
    var centers = [],
      j = Math.round(y0 / dy),
      i = Math.round(x0 / dx);
    for (var y = j * dy; y < y1 + r; y += dy, ++j) {
      for (var x = i * dx + ((j & 1) * dx) / 2; x < x1 + dx / 2; x += dx) {
        centers.push([x, y]);
      }
    }
    return centers;
  };

  this.mesh = function() {
    var fragment = hexagon(r)
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

export class RectangularBinner {
  constructor(points, gridNumber) {
    this.points = points;
    this.gridNumber = gridNumber;
    this.gridSize = 1.0 / gridNumber;
  }

  get rectangles() {
    let self = this;
    let points = this.points;
    let gridNumber = this.gridNumber;
    let gridSize = 1.0 / gridNumber;
    let bins = [];
    for (let i = 0; i < gridNumber; i++) {
      let b = [];
      for (let j = 0; j < gridNumber; j++) {
        b = []; //bin as an empty array.
      }
      bins.push(b);
    }

    let n = points.length;
    for (let pi = 0; pi < n; pi++) {
      let point = points[pi];
      let x = point[0];
      let y = point[1];
      let j = x == 1 ? gridNumber - 1 : Math.floor(x / gridSize);
      let i = y == 0 ? gridNumber - 1 : Math.floor((1 - y) / gridSize);
      bins[i][j].push(point);
    }

    return bins;
  }
}

import { distance } from './mst';
import _ from 'underscore';

export class LeaderBinner {
  constructor(points, radius) {
    this.points = points;
    this.radius = radius;
  }

  get leaders() {
    let self = this;
    let theLeaders = [];

    this.points.forEach((point) => {
      let leader = closestLeader(theLeaders, point);
      if (!leader) {
        let newLeader = [];
        newLeader.x = point[0];
        newLeader.y = point[1];
        theLeaders.push(newLeader);
      }
    });

    this.points.forEach((point) => {
      let leader = closestLeader(theLeaders, point);
      leader.push(point);
    });
    return theLeaders;

    function closestLeader(leaders, point) {
      let length = leaders.length;
      let minDistance = 2; //select 2 since normalized distance can't  be greater than 2.
      let theLeader = null;
      for (let i = 0; i < length; ++i) {
        let l = leaders[i];
        let d = distance([l.x, l.y], point);
        if (d < self.radius) {
          if (d < minDistance) {
            minDistance = d;
            theLeader = l;
          }
        }
      }
      return theLeader;
    }
  }
}
