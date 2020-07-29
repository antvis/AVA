import { quantile } from 'simple-statistics';
import {
  concaveHull,
  convexHull,
  distance,
  getAllV2CornersFromTree,
  getAllV1sFromTree,
  concaveHullArea,
  concaveHullLength,
  convexHullArea,
} from './grapher';

export class Skinny {
  alphaHull: string | any;
  constructor(alphaHull: any) {
    this.alphaHull = alphaHull.slice();
  }

  score() {
    return 1 - Math.sqrt(4 * Math.PI * concaveHullArea(this.alphaHull)) / concaveHullLength(this.alphaHull);
  }
}

export class Convex {
  tree: any;
  alpha: number;
  cch: any;
  cvh: any;

  constructor(tree: any, alpha: number) {
    this.tree = tree;
    this.alpha = 1 / alpha;
  }

  score() {
    let concaveArea = concaveHullArea(this.concaveHull());
    let convexArea = convexHullArea(this.convexHull());
    if (convexArea === 0) {
      return 0;
    }
    return concaveArea / convexArea;
  }

  concaveHull() {
    if (!this.cch) {
      let tree = JSON.parse(JSON.stringify(this.tree));
      let sites = tree.nodes.map((d: { id: any }) => d.id);
      let cch = concaveHull(this.alpha, sites);

      this.cch = cch;
    }
    return this.cch;
  }

  convexHull() {
    if (!this.cvh) {
      //Clone the tree to avoid modifying it
      let tree = JSON.parse(JSON.stringify(this.tree));
      let sites = tree.nodes.map((d: { id: any }) => d.id);
      this.cvh = convexHull(sites);
    }
    return this.cvh;
  }
}

export class Skewed {
  tree: any;

  constructor(tree: any) {
    this.tree = JSON.parse(JSON.stringify(tree));
  }

  score() {
    let allLengths = this.tree.links.map((l) => l.weight),
      q90 = quantile(allLengths, 0.9),
      q50 = quantile(allLengths, 0.5),
      q10 = quantile(allLengths, 0.1);
    if (q90 != q10) {
      return (q90 - q50) / (q90 - q10);
    } else {
      return 0;
    }
  }
}

export class Monotonic {
  points: string | any;

  constructor(points: string | any) {
    this.points = points.slice(0);
  }

  score() {
    let xArr: any[] = [];
    let yArr: any[] = [];
    this.points.forEach((p) => {
      xArr.push(p[0]);
      yArr.push(p[1]);
    });
    let r = computeSpearmans(xArr, yArr);
    return Math.pow(r, 2);

    function computeSpearmans(arrX: string | any, arrY: string | any) {
      // simple error handling for input arrays of nonequal lengths
      if (arrX.length !== arrY.length) {
        return null;
      }

      // number of observations
      let n = arrX.length;

      // rank datasets
      let xRanked = rankArray(arrX),
        yRanked = rankArray(arrY);

      // sum of distances between ranks
      let dsq = 0;
      for (let i = 0; i < n; i++) {
        dsq += Math.pow(xRanked[i] - yRanked[i], 2);
      }

      // compute correction for ties
      let xTies = countTies(arrX),
        yTies = countTies(arrY);
      let xCorrection = 0,
        yCorrection = 0;
      for (let tieLength in xTies) {
        xCorrection += xTies[tieLength] * tieLength * (Math.pow(tieLength, 2) - 1);
      }
      xCorrection /= 12.0;
      for (let tieLength in yTies) {
        yCorrection += yTies[tieLength] * tieLength * (Math.pow(tieLength, 2) - 1);
      }
      yCorrection /= 12.0;

      // denominator
      let denominator = (n * (Math.pow(n, 2) - 1)) / 6.0;

      // compute rho
      let rho = denominator - dsq - xCorrection - yCorrection;

      let x = (denominator - 2 * xCorrection) * (denominator - 2 * yCorrection);

      if (x <= 0) {
        return 0;
      } else {
        rho /= Math.sqrt(x);
      }

      return rho;
    }

    function rankArray(arr: any[]) {
      let sorted = arr.slice().sort(function(a, b) {
        return b - a;
      });
      let ranks = arr.slice().map(function(v) {
        return sorted.indexOf(v) + 1;
      });

      // counts of each rank
      let counts = {};
      ranks.forEach(function(x) {
        counts[x] = (counts[x] || 0) + 1;
      });

      // average duplicates
      ranks = ranks.map(function(x) {
        return x + 0.5 * ((counts[x] || 0) - 1);
      });

      return ranks;
    }

    function countTies(arr: any[]) {
      let ties = {},
        arrSorted = arr.slice().sort(),
        currValue = arrSorted[0],
        tieLength = 1;

      for (let i = 1; i < arrSorted.length; i++) {
        if (arrSorted[i] === currValue) {
          tieLength++;
        } else {
          if (tieLength > 1) {
            if (ties[tieLength] === undefined) ties[tieLength] = 0;
            ties[tieLength]++;
          }
          currValue = arrSorted[i];
          tieLength = 1;
        }
      }
      if (tieLength > 1) {
        if (ties[tieLength] === undefined) ties[tieLength] = 0;
        ties[tieLength]++;
      }
      return ties;
    }
  }
}

export class Stringy {
  tree: any;
  constructor(tree: any) {
    //Clone the tree to avoid modifying it
    this.tree = JSON.parse(JSON.stringify(tree));
  }

  score() {
    //Loop through the nodes.
    let verticesCount = this.tree.nodes.length;
    let v2Count = this.getAllV2Corners().length;
    let v1Count = this.getAllV1s().length;
    return v2Count / (verticesCount - v1Count);
  }

  getAllV2Corners() {
    return getAllV2CornersFromTree(this.tree);
  }

  getAllV1s() {
    return getAllV1sFromTree(this.tree);
  }
}

export class Striated {
  tree: any;
  constructor(tree: {}) {
    this.tree = JSON.parse(JSON.stringify(tree));
  }

  score() {
    let allObtuseV2CornersCount = this.getAllObtuseV2Corners().length;
    let v1Count = getAllV1sFromTree(this.tree).length;

    let verticesCount = this.tree.nodes.length;
    return allObtuseV2CornersCount / (verticesCount - v1Count);
  }

  getAllObtuseV2Corners() {
    let allV2Corners = this.getAllV2Corners();
    let allObtuseV2Corners: any = [];
    allV2Corners.forEach((corner) => {
      let cs = cosine(corner[0], corner[1], corner[2]);
      if (cs <= -0.75) {
        allObtuseV2Corners.push(corner);
      }
    });
    return allObtuseV2Corners;

    function cosine(p1: any, p2: any, p3: any) {
      let p12 = distance(p1, p2),
        p13 = distance(p1, p3),
        p23 = distance(p2, p3);
      return (Math.pow(p12, 2) + Math.pow(p13, 2) - Math.pow(p23, 2)) / (2 * p12 * p13);
    }
  }

  getAllV2Corners() {
    return getAllV2CornersFromTree(this.tree);
  }
}

export class Sparse {
  tree: any;
  constructor(tree: any) {
    this.tree = JSON.parse(JSON.stringify(tree));
  }

  score() {
    let allLengths = this.tree.links.map((l) => l.weight),
      q90 = quantile(allLengths, 0.9);
    return q90;
  }
}
