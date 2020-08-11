import { pairs } from './num/pair';
import { isA2DLine } from './constructor';
import alphaShape from 'alphashape-ts';
import { Delaunay } from 'd3-delaunay';
import * as polygon from 'd3-polygon';

class Node {
  id_: string | number;
  parent_: Node;
  rank_: number;

  constructor(id: string | number) {
    this.id_ = id;
    this.parent_ = this;
    this.rank_ = 0;
  }
}

export class DisjointSet {
  index_: any = {};

  constructor() {
    this.index_ = {};
  }

  makeSet(id: string | number) {
    if (!this.index_[id]) {
      const created = new Node(id);
      this.index_[id] = created;
    }
  }

  find(id: string | number) {
    if (this.index_[id] === undefined) {
      return undefined;
    }

    let current = this.index_[id].parent_;

    while (current !== current.parent_) {
      current = current.parent_;
    }

    return current.id_;
  }

  union(x: number, y: number) {
    const xRoot = this.index_[this.find(x)];
    const yRoot = this.index_[this.find(y)];

    if (xRoot === undefined || yRoot === undefined || xRoot === yRoot) {
      // x and y already belong to the same set.
      return;
    }

    if (xRoot.rank < yRoot.rank) {
      // Move x into the set y is a member of.
      xRoot.parent_ = yRoot;
    } else if (yRoot.rank_ < xRoot.rank_) {
      // Move y into the set x is a member of.
      yRoot.parent_ = xRoot;
    } else {
      // Arbitrarily choose to move y into the set x is a member of.
      yRoot.parent_ = xRoot;
      xRoot.rank_ += 1;
    }
  }

  // Returns the current number of disjoint sets.
  size() {
    const uniqueIndices: any = {};

    Object.keys(this.index_).forEach((id) => {
      uniqueIndices[id] = true;
    });

    return Object.keys(uniqueIndices).length;
  }
}

export function pairNodeLinks(links: any) {
  const nestedByNodes: any = {};

  links.forEach((l: any) => {
    const sourceKey = l.source.join(',');
    if (!nestedByNodes[sourceKey]) {
      nestedByNodes[sourceKey] = [];
    }
    nestedByNodes[sourceKey].push(l);

    const targetKey = l.target.join(',');
    if (!nestedByNodes[targetKey]) {
      nestedByNodes[targetKey] = [];
    }
    nestedByNodes[targetKey].push(l);
  });

  //Pair the results
  const pairedResults = pairs(nestedByNodes);

  return pairedResults;
}

export function getAllV2CornersFromTree(tree: any) {
  const pairedResults = pairNodeLinks(tree.links);

  //Get all pairs with length = 2 (V2)
  const allV2 = pairedResults.filter((p) => p[1].length === 2);

  const allCorners = allV2.map((v2) => {
    const corner = [];

    corner.push(v2[0].split(',').map((d: string | number) => +d));

    v2[1].forEach((link: { source: any[]; target: any }) => {
      if (link.source.join(',') !== v2[0]) {
        corner.push(link.source);
      } else {
        corner.push(link.target);
      }
    });

    return corner;
  });

  return allCorners;
}

export function getAllV1sFromTree(tree: any) {
  const pairedResults = pairNodeLinks(tree.links);

  const allV1 = pairedResults.filter((p) => p[1].length === 1);

  return allV1.map((v1) => v1[0].split(',').map(Number));
}

export function getAllV2OrGreaterFromTree(tree: any) {
  const pairedResults = pairNodeLinks(tree.links);

  const allGTEV2 = pairedResults.filter((p) => p[1].length >= 2);

  return allGTEV2.map((v) => v[0].split(',').map(Number));
}

export function createGraph(triangles: any) {
  function makeLink(sourceId: any, targetId: any, weight: number) {
    return { source: sourceId, target: targetId, weight: weight };
  }

  const graph: any = {};
  graph.nodes = [];
  graph.links = [];

  //Creating nodes
  triangles.forEach((t: any) => {
    for (let i = 0; i < 3; i++) {
      const id = t[i];

      if (!idExists(graph.nodes, id)) {
        graph.nodes.push(makeNode(id));
      }
    }
  });

  //Creating links
  triangles.forEach((t: any) => {
    for (let i = 0; i < 3; i++) {
      const p1 = t[i];
      const p2 = t[(i + 1) % 3];

      const id1 = p1;
      const id2 = p2;

      const dist = distance(p1, p2);
      const link = makeLink(id1, id2, dist);

      if (!linkExists(graph.links, link)) {
        graph.links.push(link);
      }
    }
  });

  function linkExists(links: any, link: any) {
    const length = links.length;

    for (let i = length - 1; i >= 0; --i) {
      if (equalLinks(link, links[i])) {
        return true;
      }
    }

    return false;
  }

  return graph;
}

export function distance(a: number[], b: number[]) {
  const dx = a[0] - b[0],
    dy = a[1] - b[1];

  return Math.round(Math.sqrt(dx * dx + dy * dy) * Math.pow(10, 10)) / Math.pow(10, 10);
}

export function equalPoints(id1: number[], id2: number[]) {
  return id1[0] === id2[0] && id1[1] === id2[1];
}

export function equalLinks(l1: { source: any; target: any }, l2: { source: any; target: any }) {
  return (
    (equalPoints(l1.source, l2.source) && equalPoints(l1.target, l2.target)) ||
    (equalPoints(l1.source, l2.target) && equalPoints(l1.target, l2.source))
  );
}

export function idExists(nodes: any[], id: number[]) {
  const length = nodes.length;

  for (let i = length - 1; i >= 0; --i) {
    const node = nodes[i];

    if (equalPoints(node.id, id)) {
      return true;
    }
  }

  return false;
}

export function makeNode(id: any) {
  return { id: id };
}

export function mst(graph: { nodes?: any; links?: any }) {
  const vertices = graph.nodes,
    edges = graph.links.slice(0),
    selectedEdges = [],
    forest: any = new DisjointSet();

  vertices.forEach((vertex: { id: number[] }) => {
    forest.makeSet(vertex.id);
  });

  edges.sort((a: any, b: any) => {
    return -(a.weight - b.weight);
  });

  while (edges.length && forest.size() > 1) {
    const edge = edges.pop();

    if (forest.find(edge.source) !== forest.find(edge.target)) {
      forest.union(edge.source, edge.target);
      selectedEdges.push(edge);
    }
  }

  return {
    nodes: vertices,
    links: selectedEdges,
  };
}

export function delaunayFromPoints(sites: any | any[]) {
  let delaunay: any = {};

  if (isA2DLine(sites)) {
    const copiedSites = sites.slice();

    copiedSites.sort((a: number[], b: number[]) => (a[0] > b[0] ? a[0] - b[0] : a[1] - b[1]));

    const tgs = [];
    const siteLength = copiedSites.length;

    for (let i = 0; i < siteLength; i = i + 2) {
      if (i + 1 < siteLength) {
        tgs.push(i);
        tgs.push(i + 1);
      }

      if (i + 2 < siteLength) {
        tgs.push(i + 2);
      } else if (siteLength % 2 === 0) {
        tgs.push(i - 1);
      }
    }

    delaunay.triangles = tgs;
    delaunay.points = copiedSites;
  } else {
    delaunay = Delaunay.from(sites);
    delaunay.points = sites;
  }

  delaunay.triangleCoordinates = function() {
    const triangles = this.triangles;
    const coord = [];

    for (let i = 0; i < triangles.length; i += 3) {
      coord.push([this.points[triangles[i]], this.points[triangles[i + 1]], this.points[triangles[i + 2]]]);
    }
    return coord;
  };

  return delaunay;
}

export function concaveHull(alpha: number, sites: number[][]) {
  //check if the sites are on the same line
  if (isA2DLine(sites)) {
    return [sites];
  }

  let cells = alphaShape(alpha, sites);

  if (cells.length === 0) {
    cells = concaveHull1(sites, 1 / alpha);
  }

  let hulls = [] as any;
  processCells(cells, hulls);

  hulls = hulls.map((h: Iterable<unknown> | ArrayLike<unknown>) => {
    //Get vertices
    const vertices = Array.from(h).map((item: any) => {
      return sites[item];
    });

    return sortVerticies(vertices);
  });

  return hulls;
}

export function concaveHullArea(hulls: [number, number][][]) {
  let total = 0;

  hulls.forEach((h: [number, number][]) => {
    total += Math.abs(polygon.polygonArea(h));
  });

  return total;
}

export function concaveHullLength(hulls: [number, number][][]) {
  let total = 0;

  hulls.forEach((h: [number, number][]) => {
    total += polygon.polygonLength(h);
  });

  return total;
}

export function convexHull(sites: number[][]) {
  //check if the sites are on the same line
  if (isA2DLine(sites)) {
    return sites;
  }

  const cells = alphaShape(0, sites);
  const h = Array.from(new Set(cells.flat()));

  //Get vertices
  const vertices = Array.from(h).map((item: any) => {
    return sites[item];
  });

  return sortVerticies(vertices);
}

export function convexHullArea(hull: [number, number][]) {
  return Math.abs(polygon.polygonArea(hull));
}

function putCellToHulls(cell: any[], hulls: string | any[]) {
  for (let i = 0; i < hulls.length; i++) {
    const hull = hulls[i];

    if (hull.has(cell[0])) {
      hull.add(cell[1]);

      return true;
    } else if (hull.has(cell[1])) {
      hull.add(cell[0]);

      return true;
    }
  }
  return false;
}

function processCells(cells: any[], hulls: Set<unknown>[]) {
  if (cells.length === 0) {
    return;
  }

  const processedIndice: any[] = [];

  cells.forEach((cell: any, i: any) => {
    if (putCellToHulls(cell, hulls)) {
      processedIndice.push(i);
    }
  });

  if (processedIndice.length === 0) {
    //Put first one in the hull
    const cell = cells.shift();

    const hull = new Set(cell);
    hulls.push(hull);
  } else {
    //Remove the processed items and continue.
    cells = cells.filter((v: any, i: any) => processedIndice.indexOf(i) < 0);
  }
  //Do this recursively
  processCells(cells, hulls);
}

function sortVerticies(points: any[]) {
  const center = findCentroid(points);

  points.sort((a: number[], b: number[]) => {
    const a1 = (toDegrees(Math.atan2(a[0] - center[0], a[1] - center[1])) + 360) % 360;
    const a2 = (toDegrees(Math.atan2(b[0] - center[0], b[1] - center[1])) + 360) % 360;

    return Math.round(a1 - a2);
  });

  return points;

  function toDegrees(angle: number) {
    return angle * (180 / Math.PI);
  }

  function findCentroid(points: any[]) {
    let x = 0;
    let y = 0;

    points.forEach((p: number[]) => {
      x += p[0];
      y += p[1];
    });

    const center = [];
    center.push(x / points.length);
    center.push(y / points.length);

    return center;
  }
}

export function concaveHull1(sites: any, longEdge: number) {
  const delaunay = Delaunay.from(sites);

  let cells = [];
  longEdge = longEdge - 10e-3;

  const triangles = delaunay.triangles;

  const points = sites;
  while (cells.length <= 0) {
    longEdge = longEdge + 10e-3;

    for (let i = 0; i < triangles.length; i += 3) {
      for (let j = 0; j < 3; j++) {
        const d = distance(points[triangles[i + j]], points[triangles[i + ((j + 1) % 3)]]);

        if (d < longEdge) {
          cells.push([triangles[i + j], triangles[i + ((j + 1) % 3)]]);
        }
      }
    }
  }

  const edgeCount: any = {};
  cells.forEach((edge) => {
    const theKey = edge.sort().join(',');

    edgeCount[theKey] = edgeCount[theKey] ? edgeCount[theKey] : 0 + 1;
  });

  cells = cells.filter((edge) => {
    const theKey = edge.sort().join(',');

    return edgeCount[theKey] === 1;
  });

  return cells;
}
