import uniq from './num/uniq';
import difference from './num/difference';
import without from './num/without';
import { first } from './num/defaultFunc';
import { max, quantile } from './util';
import {
  equalPoints,
  pairNodeLinks,
  equalLinks,
  createGraph,
  mst,
  getAllV2OrGreaterFromTree,
  delaunayFromPoints,
} from './grapher';

export class Clumpy {
  tree: any;

  constructor(tree: any) {
    this.tree = JSON.parse(JSON.stringify(tree));
  }

  score() {
    const allRuntRatios: number[] = [];

    this.tree.links.forEach((link: any) => {
      const rg = this.runtGraph(link);
      if (rg.length > 0) {
        allRuntRatios.push(this.maxLength(rg) / link.weight);
      }
    });

    if (allRuntRatios.length > 0) {
      return max(allRuntRatios.map((rr) => 1 - rr));
    } else {
      return 0;
    }
  }

  runtGraph(link: any) {
    let greaterOrEqualLinks = this.tree.links.filter((l: any) => l.weight < link.weight);

    //Remove the currently checking link.
    greaterOrEqualLinks = greaterOrEqualLinks.filter((l: any) => !equalLinks(l, link));
    const pairedResults = pairNodeLinks(greaterOrEqualLinks);

    //Process the source side.
    const sourceConnectedNodes = [link.source];
    const sourceConnectedLinks = this.getConnectedLinks(sourceConnectedNodes, pairedResults);

    const targetConnectedNodes = [link.target];
    const targetConnectedLinks = this.getConnectedLinks(targetConnectedNodes, pairedResults);

    return sourceConnectedLinks.length < targetConnectedLinks.length ? sourceConnectedLinks : targetConnectedLinks;
  }

  getConnectedLinks(connectedNodes: any, pairedResults: any) {
    const processedNodes: string | any[] = [];
    let connectedLinks: any[] = [];

    while (connectedNodes.length > 0) {
      if (connectedLinks.length > this.tree.links.length + 1) {
        break;
      }

      const firstNode = first(connectedNodes);

      connectedNodes = without(connectedNodes, firstNode);
      processedNodes.push(firstNode);

      //Find the edges connected to that node.
      const result = pairedResults.find((p: any) => p[0] === firstNode.join(','));
      const links = result ? result[1] : [];
      connectedLinks = connectedLinks.concat(links);

      //Add new nodes to be processed
      links.forEach((l: any) => {
        if (!pointExists(processedNodes, l.source)) {
          connectedNodes.push(l.source);
        }

        if (!pointExists(processedNodes, l.target)) {
          connectedNodes.push(l.target);
        }
      });
    }
    return connectedLinks;
  }

  maxLength(runtGraph: any[]) {
    if (runtGraph.length === 0) {
      return 0;
    }

    return max(runtGraph.map((l) => l.weight));
  }
}
export function pointExists(points: string | any[], point: any) {
  for (let i = 0; i < points.length; i++) {
    const point1 = points[i];

    if (equalPoints(point1, point)) {
      return true;
    }
  }
  return false;
}

export class Outlying {
  tree?: any;
  upperBound?: number | undefined;
  outlyingPoints?: any[];
  noOutlyingTree?: {};
  outlyingLinks: any;

  constructor(tree: any, upperBound?: number | undefined) {
    this.tree = JSON.parse(JSON.stringify(tree));
    this.upperBound = upperBound;

    if (!upperBound) {
      upperBound = findUpperBound(this.tree, 1.5);
      this.upperBound = upperBound;
    }

    markLongLinks(this.tree, upperBound!);
    const normalNodes = findNormalNodes(this.tree);

    this.outlyingPoints = findOutlyingPoints(this.tree, normalNodes);

    markOutlyingLinks(this.tree, this.outlyingPoints);

    this.noOutlyingTree = buildNoOutlyingTree(this.tree, this.outlyingPoints);

    function buildNoOutlyingTree(tree: any, outlyingPoints: any[]) {
      let noOutlyingTree: any = {};

      noOutlyingTree.nodes = normalNodes;
      noOutlyingTree.links = tree.links.filter((l: any) => l.isOutlying !== true);

      const outlyingPointsStr = outlyingPoints.map((p) => p.join(','));
      const v2OrGreaterStr = getAllV2OrGreaterFromTree(tree).map((p) => p.join(','));

      const diff = difference(outlyingPointsStr, v2OrGreaterStr);

      if (diff.length < outlyingPointsStr.length) {
        const delaunay = delaunayFromPoints(noOutlyingTree.nodes.map((n: any) => n.id));
        const graph = createGraph(delaunay.triangleCoordinates());
        noOutlyingTree = mst(graph);
      }

      return noOutlyingTree;
    }

    function markOutlyingLinks(tree: any, outlyingPoints: string | any[]) {
      if (outlyingPoints.length > 0) {
        //Check the long links only
        tree.links
          .filter((l: any) => l.isLong)
          .forEach((l: any) => {
            if (pointExists(outlyingPoints, l.source) || pointExists(outlyingPoints, l.target)) {
              l.isOutlying = true;
            }
          });
      }
    }

    function findNormalNodes(tree: any) {
      //Remove long links
      const normalLinks = tree.links.filter((l: any) => !l.isLong);
      //Remove outlying nodes (nodes are not in any none-long links)
      let allNodesWithLinks: any[] = [];

      normalLinks.forEach((l: any) => {
        allNodesWithLinks.push(l.source);
        allNodesWithLinks.push(l.target);
      });

      //allNodesWithLinks = uniq(allNodesWithLinks, false, (d: any[]) => d.join(','));

      allNodesWithLinks = uniq(allNodesWithLinks, false);

      const normalNodes = allNodesWithLinks.map((n) => {
        return { id: n };
      });

      return normalNodes;
    }

    function findOutlyingPoints(tree: any, normalNodes: any) {
      const newNodes = normalNodes;
      const oldNodes = tree.nodes;
      const ops: any[] = [];

      oldNodes.forEach((on: any) => {
        if (
          !pointExists(
            newNodes.map((nn: any) => nn.id),
            on.id
          )
        ) {
          ops.push(on.id);
        }
      });

      return ops;
    }

    function markLongLinks(tree: any, upperBound: number) {
      tree.links.forEach((l: any) => {
        if (l.weight > upperBound) {
          l.isLong = true;
        }
      });
    }

    function findUpperBound(tree: any, coefficient: number) {
      const allLengths = tree.links.map((l: any) => l.weight),
        q1 = quantile(allLengths, 0.25),
        q3 = quantile(allLengths, 0.75),
        iqr = q3 - q1,
        upperBound = q3 + coefficient * iqr;

      return upperBound;
    }
  }

  score() {
    let totalLengths = 0;
    let totalOutlyingLengths = 0;

    this.tree.links.forEach((l: any) => {
      totalLengths += l.weight;

      if (l.isOutlying) {
        totalOutlyingLengths += l.weight;
      }
    });

    return totalOutlyingLengths / totalLengths;
  }

  /**
   * Returns outlying links
   */
  links() {
    if (!this.outlyingLinks) {
      this.outlyingLinks = this.tree.links.filter((l: any) => l.isOutlying);
    }

    return this.outlyingLinks;
  }

  /**
   * Remove outlying links and nodes and return a new tree without outlying points/edges
   */
  removeOutlying() {
    return this.noOutlyingTree;
  }

  /**
   * Returns the outlying points (in form of points, not node object).
   * @returns {Array}
   */
  points() {
    return this.outlyingPoints;
  }
}
