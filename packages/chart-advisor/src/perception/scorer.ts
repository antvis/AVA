import uniq from './findScag/num/uniq';
import groupBy from './findScag/num/groupBy';
import { Normalizer, Binner } from './findScag/constructor';
import { createGraph, mst, delaunayFromPoints } from './findScag/grapher';
import { Outlying, Clumpy } from './findScag/coremeasure';
import { Convex, Skinny, Stringy, Skewed, Sparse, Striated, Monotonic } from './findScag/computator';
import { ScagOptions, ScagScanner } from './findScag/interface';

export function scagScorer(this: any, inputPoints: any, options: ScagOptions) {
  const scanner: ScagScanner = {};

  let binType = options.binType,
    startBinGridSize = options.startBinGridSize;

  const isBinned = options.isBinned,
    isNormalized = options.isNormalized,
    minBins = options.minBins,
    maxBins = options.maxBins;

  const points = inputPoints.slice(0);
  let normalizedPoints = points;

  //Normalization
  if (!isNormalized) {
    const normalizer = new Normalizer(points);
    normalizedPoints = normalizer.normalizedPoints;
  }
  // scanner.normalizedPoints', normalizedPoints);

  //Binning
  let sites = null;
  let bins: any[] | null = null;
  let binner = null;
  let binSize = null;
  let binRadius = 0;

  if (!binType) {
    binType = 'hexagon';
  }

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

    // console.log('start')

    const uniqueKeys = uniq(normalizedPoints.map((p: any) => p.join(',')));
    const groups: any = groupBy(normalizedPoints, (p) => p.join(','));

    // let pweg = 0;
    // if (pweg === 0) {
    //   throw new TypeError('no perceptual insight');
    // }
    if (uniqueKeys.length < minNumOfBins) {
      uniqueKeys.forEach((key) => {
        const bin: any = groups[key];

        bin.x = bin[0][0];
        bin.y = bin[0][1];
        bin.binRadius = 0;
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

          binner = new Binner(normalizedPoints, binRadius);

          bins = binner.hexbin();
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

  // console.log("pre")

  // scanner.binnedSites', sites);

  // Delaunay triangulation
  const delaunay = delaunayFromPoints(sites);
  // const triangles = delaunay.triangles;
  const triangleCoordinates = delaunay.triangleCoordinates();

  // console.log("DT")

  // //Triangulation graphs
  // scanner.delaunay', delaunay);
  // scanner.triangles', triangles);
  // scanner.triangleCoordinates', triangleCoordinates);

  //MST
  const graph = createGraph(triangleCoordinates);
  const mstree = mst(graph);

  // console.log("MST")

  // //Output graphs
  // scanner.graph', graph);
  // scanner.mst', mstree);

  // console.log("Measures")

  //Outlying
  const outlying = new Outlying(mstree);
  const outlyingScore = outlying.score();
  scanner.outlyingScore = outlyingScore;

  const outlyingUpperBound = outlying.upperBound;
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
