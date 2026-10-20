import type { SemanticJoin } from './types';

/** A join step oriented from an already-joined model to a new one. */
export interface JoinStep {
  /** Model already in the FROM clause. */
  from: string;
  /** Model being joined. */
  to: string;
  /** Key pairs oriented so `from` refers to the already-joined model. */
  keys?: { from: string; to: string }[];
  on?: string;
  type: 'inner' | 'left' | 'right';
}

/** Undirected join graph over semantic models. */
export class JoinGraph {
  private readonly adjacency = new Map<string, JoinStep[]>();

  constructor(joins: SemanticJoin[]) {
    for (const join of joins) {
      const type = join.type ?? 'left';
      this.edge(join.from).push({ ...join, type });
      this.edge(join.to).push({
        from: join.to,
        to: join.from,
        keys: join.keys?.map((k) => ({ from: k.to, to: k.from })),
        on: join.on?.replace(/\{(FROM|TO)\}/g, (_, side) => (side === 'FROM' ? '{TO}' : '{FROM}')),
        type: type === 'left' ? 'right' : type,
      });
    }
  }

  private edge(model: string): JoinStep[] {
    let list = this.adjacency.get(model);
    if (!list) this.adjacency.set(model, (list = []));
    return list;
  }

  /** Shortest path of join steps from one model to another, deterministic by declaration order. */
  path(start: string, target: string): JoinStep[] | null {
    if (start === target) return [];

    const previous = new Map<string, JoinStep>();
    const visited = new Set([start]);
    const queue = [start];

    while (queue.length) {
      const current = queue.shift()!;
      for (const step of this.adjacency.get(current) ?? []) {
        if (visited.has(step.to)) continue;
        visited.add(step.to);
        previous.set(step.to, step);
        if (step.to === target) {
          const path: JoinStep[] = [];
          for (let node = target; node !== start; node = previous.get(node)!.from) path.unshift(previous.get(node)!);
          return path;
        }
        queue.push(step.to);
      }
    }

    return null;
  }

  /** Ordered, duplicate-free join steps connecting `root` to all `targets`. */
  plan(root: string, targets: string[]): JoinStep[] {
    const joined = new Set([root]);
    const steps: JoinStep[] = [];

    for (const target of targets) {
      if (joined.has(target)) continue;
      const path = this.path(root, target);
      if (!path) throw new Error(`No join path between models "${root}" and "${target}"`);
      for (const step of path) {
        if (joined.has(step.to)) continue;
        joined.add(step.to);
        steps.push(step);
      }
    }

    return steps;
  }
}
