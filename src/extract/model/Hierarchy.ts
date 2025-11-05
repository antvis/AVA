import { HierarchyLikeDataType } from '@ava/types';

export class Hierarchy {
  roots!: HierarchyLikeDataType;

  constructor(roots: HierarchyLikeDataType) {
    this.roots = roots;
  }

  getFeatures() {
    return [];
  }
}
