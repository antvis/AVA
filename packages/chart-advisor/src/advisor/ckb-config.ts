import { ChartKnowledgeJSON } from '@antv/ckb';
import { AntVSpec } from '@antv/antv-spec';
import { DataFrame } from './utils/dataframe';

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
   * TODO: customize spec-mapping functions
   */
  custom?: Record<string, CustomizedCKBJSON>;
};

type SpecMapping = (dataFrame: DataFrame) => AntVSpec;

export interface CustomizedCKBJSON extends ChartKnowledgeJSON {
  toSpec?: SpecMapping;
}
