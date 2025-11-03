import { HierarchyLikeDataType } from '@ava/types';

export class Hierarchy {
  root!: HierarchyLikeDataType;

  constructor(data: HierarchyLikeDataType) {
    this.root = data;
  }

  getFeatures() {
    return [];
  }
}
