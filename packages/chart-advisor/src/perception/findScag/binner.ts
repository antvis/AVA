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
