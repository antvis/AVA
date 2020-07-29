import _, { AnyFalsy } from 'underscore';
import { max, quantile } from 'simple-statistics';
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
    let allRuntRatios: number[] = [];

    this.tree.links.forEach((link: any) => {
      let rg = this.runtGraph(link);
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
    let pairedResults = pairNodeLinks(greaterOrEqualLinks);

    //Process the source side.
    let sourceConnectedNodes = [link.source];
    let sourceConnectedLinks = this.getConnectedLinks(sourceConnectedNodes, pairedResults);

    let targetConnectedNodes = [link.target];
    let targetConnectedLinks = this.getConnectedLinks(targetConnectedNodes, pairedResults);

    return sourceConnectedLinks.length < targetConnectedLinks.length ? sourceConnectedLinks : targetConnectedLinks;
  }

  getConnectedLinks(connectedNodes: any, pairedResults: any) {
    let processedNodes: string | any[] = [];
    let connectedLinks: any[] = [];
    while (connectedNodes.length > 0) {
      if (connectedLinks.length > this.tree.links.length + 1) {
        break;
      }
      let firstNode = _.first(connectedNodes);

      connectedNodes = _.without(connectedNodes, firstNode);
      processedNodes.push(firstNode);

      //Find the edges connected to that node.
      let result = pairedResults.find((p: any) => p[0] === firstNode.join(','));
      let links = result ? result[1] : [];
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
    let point1 = points[i];
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
  constructor(tree: any, upperBound: number | undefined) {
    this.tree = JSON.parse(JSON.stringify(tree));
    this.upperBound = upperBound;

    if (!upperBound) {
      upperBound = findUpperBound(this.tree, 1.5);
      this.upperBound = upperBound;
    }

    markLongLinks(this.tree, upperBound);
    let normalNodes = findNormalNodes(this.tree);

    this.outlyingPoints = findOutlyingPoints(this.tree, normalNodes);

    markOutlyingLinks(this.tree, this.outlyingPoints);

    this.noOutlyingTree = buildNoOutlyingTree(this.tree, this.outlyingPoints);

    function buildNoOutlyingTree(tree: any, outlyingPoints: any[]) {
      let noOutlyingTree: any = {};
      noOutlyingTree.nodes = normalNodes;
      noOutlyingTree.links = tree.links.filter((l: any) => l.isOutlying !== true);

      let outlyingPointsStr = outlyingPoints.map((p) => p.join(','));
      let v2OrGreaterStr = getAllV2OrGreaterFromTree(tree).map((p) => p.join(','));

      let diff = _.difference(outlyingPointsStr, v2OrGreaterStr);
      if (diff.length < outlyingPointsStr.length) {
        let delaunay = delaunayFromPoints(noOutlyingTree.nodes.map((n: any) => n.id));
        let graph = createGraph(delaunay.triangleCoordinates());
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
      let normalLinks = tree.links.filter((l: any) => !l.isLong);
      //Remove outlying nodes (nodes are not in any none-long links)
      let allNodesWithLinks: any[] = [];
      normalLinks.forEach((l: any) => {
        allNodesWithLinks.push(l.source);
        allNodesWithLinks.push(l.target);
      });
      allNodesWithLinks = _.uniq(allNodesWithLinks, false, (d) => d.join(','));
      let normalNodes = allNodesWithLinks.map((n) => {
        return { id: n };
      });
      return normalNodes;
    }

    function findOutlyingPoints(tree: any, normalNodes: any) {
      let newNodes = normalNodes;
      let oldNodes = tree.nodes;
      let ops: any[] = [];

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
      let allLengths = tree.links.map((l: any) => l.weight),
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
