import { ChartKnowledgeJSON, CKBJson } from '@antv/ckb';
import { DataFrame } from '@antv/data-wizard';
import { RuleConfig, RuleModule } from '../ruler/concepts/rule';
import { BasicDataPropertyForAdvice, processRuleCfg } from '../ruler';
import { dataToAdvices } from './advice-pipeline/data-to-advices';
import { CKBConfig } from './ckb-config';
import { AdvisorOptions } from './advice-pipeline/interface';

export class Advisor {
  /**
   * @private CKB used for advising
   */
  private ckb: Record<string, ChartKnowledgeJSON>;

  /**
   * @private rule base used for advising
   */
  private ruleBase: Record<string, RuleModule>;

  /**
   *
   * @param ckbCfg ckb configuration: `include`, `exclude`, `custom`.
   *  if not specified, used `@antv/ckb` as default
   * @param ruleCfg rule base configuration: `include`, `exclude`, `custom`, `options`.
   *  if not specified, used `ruler` as default
   */
  constructor(ckbCfg?: CKBConfig, ruleCfg?: RuleConfig) {
    let ckb: Record<string, ChartKnowledgeJSON> = {};
    if (ckbCfg) {
      ckb = this.processCKBCfg(ckbCfg);
    }

    this.ckb = ckbCfg ? ckb : CKBJson('en-US', true);
    this.ruleBase = processRuleCfg(ruleCfg);
  }

  /**
   * chart advising from input data
   * @param data input data as [ { col1: ..., col2, ...}, ... ]
   * @param fields fields to focus
   * @param options advice options such as purpose
   * @returns advice list
   */
  advise(data: Record<string, any>[], fields?: string[], options?: AdvisorOptions) {
    // transform data into DataFrame
    let dataFrame: DataFrame;
    try {
      dataFrame = new DataFrame(data, { columns: fields });
    } catch (error) {
      // if the input data cannot be transformed into DataFrame
      console.error('error: ', error);
      return [];
    }

    // get dataProps from dataframe
    const dataProps = dataFrame.info();
    const advices = dataToAdvices(data, dataProps as BasicDataPropertyForAdvice[], this.ckb, this.ruleBase, options);

    return advices;
  }

  /**
   * used for testing
   * @returns ckb in Advisor instance
   */
  getCKB() {
    return this.ckb;
  }

  /**
   * used for testing
   * @returns rule base in the Advisor instance
   */
  getRuleBase() {
    return this.ruleBase;
  }

  /**
   * processing ckb config and setup ckb used for advising
   * @param ckbCfg input ckb configuration
   * @returns ckb: Record<string, ChartKnowledgeJSON>
   */
  private processCKBCfg(ckbCfg: CKBConfig) {
    // step 1: exclude charts from default CKB
    const ckbBase = CKBJson('en-US', true);
    const toExclude = ckbCfg.exclude;
    if (toExclude) {
      toExclude.forEach((chartType: string) => {
        if (Object.keys(ckbBase).includes(chartType)) {
          delete ckbBase[chartType];
        }
      });
    }

    // step 2: only include charts from default CKB after excluded
    if (ckbCfg.include) {
      const toIncluded = ckbCfg.include;
      Object.keys(ckbBase).forEach((chartType: string) => {
        if (!toIncluded.includes(chartType)) {
          delete ckbBase[chartType];
        }
      });
    }

    // step 3: combine default charts and customized charts
    const finalCkbBase = {
      ...ckbBase,
      ...ckbCfg.custom
    };

    return finalCkbBase;
  }
}

export * from './advice-pipeline';
export * from './ckb-config';
