import { groupBy, uniq } from 'underscore';
import { Normalizer, Binner } from './findScag/constructor';
import { createGraph, mst, delaunayFromPoints } from './findScag/grapher';
import { Outlying, Clumpy } from './findScag/coremeasure';
import { Convex, Skinny, Stringy, Skewed, Sparse, Striated, Monotonic } from './findScag/computator';
import { scagOptions, scagScanner } from './findScag/interface'


export function scagScorer(this: any, inputPoints: any, options: scagOptions) {
  let scanner: scagScanner = {};

  let binType = options.binType,
    startBinGridSize = options.startBinGridSize,
    isNormalized = options.isNormalized,
    isBinned = options.isBinned,
    outlyingUpperBound = options.outlyingUpperBound,
    minBins = options.minBins,
    maxBins = options.maxBins;

  const points = inputPoints.slice(0);
  let normalizedPoints = points;

  //Normalization
  if (!isNormalized) {
    let normalizer = new Normalizer(points);
    normalizedPoints = normalizer.normalizedPoints;
  }
  // scanner.normalizedPoints', normalizedPoints);

  //Binning
  let sites = null;
  let bins = null;
  let binner = null;
  let binSize = null;
  let binRadius = 0;

  if (!isBinned) {
    if (!startBinGridSize) {
      startBinGridSize = 40;
    }
    bins = [];

    let minNumOfBins = 50;
    let maxNumOfBins = 500;

    if (minBins) {
      minNumOfBins = minBins;
    }
    if (maxBins) {
      maxNumOfBins = maxBins;
    }

    const uniqueKeys = uniq(normalizedPoints.map((p: any) => p.join(',')));
    const groups = groupBy(normalizedPoints, (p) => p.join(','));

    if (uniqueKeys.length < minNumOfBins) {
      uniqueKeys.forEach((key) => {
        let bin: any = groups[key];

        bin.x = bin[0][0];
        bin.y = bin[0][1];
        bin.binRadius = 0;
        bins.push(bin);
      });
    } else {
      do {
        if (binSize === null) {
          binSize = startBinGridSize;
        } else if (bins.length > maxNumOfBins) {
          binSize = binSize / 2;
        } else if (bins.length < minNumOfBins) {
          binSize = binSize + 5;
        }

        if (binType === 'hexagon') {
          const shortDiagonal = 1 / binSize;
          binRadius = shortDiagonal / Math.sqrt(2);

          binner = Binner()
            .radius(binRadius)
            .extent([
              [0, 0],
              [1, 1],
            ]);

          bins = binner.hexbin(normalizedPoints);
        }
      } while (bins.length > maxNumOfBins || bins.length < minNumOfBins);
    }
    sites = bins.map((d: any) => [d.x, d.y]); //=>sites are the set of centers of all bins

    // //Binning output
    // scanner.binner', binner);
    // scanner.bins', bins);
    // scanner.binSize', binSize!);
    // scanner.binRadius', binRadius);
  } else {
    sites = normalizedPoints;
  }

  // scanner.binnedSites', sites);

  // Delaunay triangulation
  const delaunay = delaunayFromPoints(sites);
  // const triangles = delaunay.triangles;
  const triangleCoordinates = delaunay.triangleCoordinates();

  // //Triangulation graphs
  // scanner.delaunay', delaunay);
  // scanner.triangles', triangles);
  // scanner.triangleCoordinates', triangleCoordinates);

  //MST
  const graph = createGraph(triangleCoordinates);
  const mstree = mst(graph);

  // //Output graphs
  // scanner.graph', graph);
  // scanner.mst', mstree);

  //Outlying
  const outlying = new Outlying(mstree);
  const outlyingScore = outlying.score();
  scanner.outlyingScore = outlyingScore;

  outlyingUpperBound = outlying.upperBound;
  // scanner.outlyingUpperBound', outlyingUpperBound);

  // const outlyingLinks = outlying.links();
  // scanner.outlyingLinks', outlyingLinks);

  // const outlyingPoints = outlying.points();
  // scanner.outlyingPoints', outlyingPoints);

  const noOutlyingTree: any = outlying.removeOutlying();
  // scanner.noOutlyingTree', noOutlyingTree);

  // //Skewed
  const skewed = new Skewed(noOutlyingTree);
  const skewedScore = skewed.score();
  scanner.skewedScore = skewedScore;

  //Sparse
  const sparse = new Sparse(noOutlyingTree);
  const sparseScore = sparse.score();
  scanner.sparseScore = sparseScore;

  //Clumpy
  // let clumpy = new Clumpy(mstree);
  const clumpy = new Clumpy(noOutlyingTree);
  // scanner.clumpy', clumpy);

  const clumpyScore = clumpy.score();
  scanner.clumpyScore = clumpyScore;

  //Striated
  const striated = new Striated(noOutlyingTree);
  const striatedScore = striated.score();
  scanner.striatedScore = striatedScore;

  // const v2Corners = striated.getAllV2Corners();
  // scanner.v2Corners', v2Corners);

  // const obtuseV2Corners = striated.getAllObtuseV2Corners();
  // scanner.obtuseV2Corners', obtuseV2Corners);

  //Convex hull
  const convex = new Convex(noOutlyingTree, outlyingUpperBound!);
  // const convexHull = convex.convexHull();
  // scanner.convexHull', convexHull);

  //Alpha hull
  const alphaHull = convex.concaveHull();
  // scanner.alphaHull', alphaHull);

  //Convex
  const convexScore = convex.score();
  scanner.convexScore = convexScore;

  //Skinny
  const skinny = new Skinny(alphaHull);
  const skinnyScore = skinny.score();
  scanner.skinnyScore = skinnyScore;

  //Stringy
  const stringy = new Stringy(noOutlyingTree);
  // const v1s = stringy.getAllV1s();
  // scanner.v1s', v1s);

  const stringyScore = stringy.score();
  scanner.stringyScore = stringyScore;

  //Monotonic
  const monotonic = new Monotonic(noOutlyingTree!.nodes.map((n: any) => n.id));
  const monotonicScore = monotonic.score();
  scanner.monotonicScore = monotonicScore;

  return scanner;
}
