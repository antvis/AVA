import { TreeDataType } from '@ava/types';

export class Tree {
  root!: TreeDataType;

  constructor(data: TreeDataType) {
    this.root = data;
  }

  getFeatures() {
    return [];
  }
}
