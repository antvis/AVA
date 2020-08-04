import { quantile } from './util';
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
  alphaHull: [number, number][][];
  
  constructor(alphaHull: [number, number][][]) {
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
    const concaveArea = concaveHullArea(this.concaveHull());
    const convexArea = convexHullArea(this.convexHull());

    if (convexArea === 0) {
      return 0;
    }

    return concaveArea / convexArea;
  }

  concaveHull() {
    if (!this.cch) {
      const tree = JSON.parse(JSON.stringify(this.tree));
      const sites = tree.nodes.map((d: any) => d.id);
      const cch = concaveHull(this.alpha, sites);

      this.cch = cch;
    }

    return this.cch;
  }

  convexHull() {
    if (!this.cvh) {
      const tree = JSON.parse(JSON.stringify(this.tree));
      const sites = tree.nodes.map((d: any) => d.id);

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
    const allLengths = this.tree.links.map((l: any) => l.weight),
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
  points: number[][];

  constructor(points: number[][]) {
    this.points = points.slice(0);
  }

  score() {
    let xArr: number[] = [];
    let yArr: number[] = [];

    this.points.forEach((p: number[]) => {
      xArr.push(p[0]);
      yArr.push(p[1]);
    });

    const r = computeSpearmans(xArr, yArr);

    if(r == null) {
        return 0;
    }
    else {
        return Math.pow(r, 2);
    }

    function computeSpearmans(arrX: number[], arrY: number[]) {
      // simple error handling for input arrays of nonequal lengths
      if (arrX.length !== arrY.length) {
        return null;
      }

      // number of observations
      const n = arrX.length;

      // rank datasets
      const xRanked = rankArray(arrX),
        yRanked = rankArray(arrY);

      // sum of distances between ranks
      let dsq = 0;
      for (let i = 0; i < n; i++) {
        dsq += Math.pow(xRanked[i] - yRanked[i], 2);
      }

      // compute correction for ties
      const xTies = countTies(arrX),
        yTies = countTies(arrY);
      let xCorrection = 0,
        yCorrection = 0,
        tieLength: any;

      for (tieLength in xTies) {
        xCorrection += xTies[tieLength] * tieLength * (Math.pow(tieLength, 2) - 1);
      }
      xCorrection /= 12.0;

      for (tieLength in yTies) {
        yCorrection += yTies[tieLength] * tieLength * (Math.pow(tieLength, 2) - 1);
      }
      yCorrection /= 12.0;

      // denominator
      const denominator = (n * (Math.pow(n, 2) - 1)) / 6.0;

      // compute rho
      let rho: number = denominator - dsq - xCorrection - yCorrection;

      const x = (denominator - 2 * xCorrection) * (denominator - 2 * yCorrection);

      if (x <= 0) {
        return 0;
      } else {
        rho /= Math.sqrt(x);
      }

      return rho;
    }

    function rankArray(arr: number[]) {
      let sorted = arr.slice().sort(function(a, b) {
        return b - a;
      });

      let ranks = arr.slice().map(function(v) {
        return sorted.indexOf(v) + 1;
      });

      // counts of each rank
      let counts: number[] = [];
      ranks.forEach(function(x) {
        counts[x] = (counts[x] || 0) + 1;
      });

      // average duplicates
      ranks = ranks.map(function(x) {
        return x + 0.5 * ((counts[x] || 0) - 1);
      });

      return ranks;
    }

    function countTies(arr: number[]) {
      let ties: number[] = [],
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

  constructor(tree: any) {
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
    let allObtuseV2Corners: number[][][] = [];

    allV2Corners.forEach((corner) => {
      let cs = cosine(corner[0], corner[1], corner[2]);
      if (cs <= -0.75) {
        allObtuseV2Corners.push(corner);
      }
    });

    return allObtuseV2Corners;

    function cosine(p1: number[], p2: number[], p3: number[]) {
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
    let allLengths = this.tree.links.map((l: { weight: number }) => l.weight),
      q90 = quantile(allLengths, 0.9);
      
    return q90;
  }
}
