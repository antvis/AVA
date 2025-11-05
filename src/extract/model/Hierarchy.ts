import { HierarchyLikeDataType } from '../../types';

export class Hierarchy {
  roots!: HierarchyLikeDataType;

  constructor(roots: HierarchyLikeDataType) {
    this.roots = roots;
  }

  getFeatures() {
    return [];
  }
}
