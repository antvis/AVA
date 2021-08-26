import { ChartKnowledgeJSON } from '@antv/ckb';
import { AntVSpec } from '@antv/antv-spec';
import { BasicDataPropertyForAdvice } from '../ruler';
import { DataRows } from './advice-pipeline/interface';

export type CKBConfig = {
  /**
   * charts to exclude in the default CKB from @antv/ckb
   * priority: exclude > include
   */
  exclude?: string[];
  /**
   * charts to include in the default CKB from @antv/ckb
   * priority: exclude > include
   */
  include?: string[];
  /**
   * charts customized by users
   * not affected by `exclude` and `include`
   */
  custom?: Record<string, CustomizedCKBJSON>;
};

type SpecMapping = (data: DataRows, dataProps: BasicDataPropertyForAdvice[]) => AntVSpec | null;

export interface CustomizedCKBJSON extends ChartKnowledgeJSON {
  toSpec?: SpecMapping;
}
