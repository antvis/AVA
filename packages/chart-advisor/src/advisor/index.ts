import { ChartKnowledgeJSON, CKBJson } from '@antv/ckb';
import { RuleConfig, RuleModule } from '../ruler/concepts/rule';
import { builtInRules, getChartRules } from '../ruler/index';
import { DataFrame } from './utils/dataframe';
import { dataFrameToAdvices } from './advice-pipeline/dataframe-to-advices';
import { CKBConfig } from './ckb-config';

export class Advisor {
  private ckb: Record<string, ChartKnowledgeJSON>;

  private ruleBase: Record<string, RuleModule>;

  // TODO: Fix any
  private dataFrame: any;

  constructor(ckbCfg?: CKBConfig, ruleCfg?: RuleConfig) {
    let ckb: Record<string, ChartKnowledgeJSON> = {};
    if (ckbCfg) {
      ckb = this.processCKBCfg(ckbCfg);
    }

    this.ckb = ckbCfg ? ckb : CKBJson('en-US', true);
    this.ruleBase = this.processRuleCfg(ruleCfg);

  }

  /**
   * chart advising from input data
   * @param input data, DataFrame or raw data
   * @param fields fields to focus
   * @param options advice options such as purpose
   * @returns advice list
   */
  advise(input: any | DataFrame, fields?: string[], options?: any) {
    if (input instanceof DataFrame) {
      this.dataFrame = input;
    } else {
      try {
        this.dataFrame = new DataFrame(input, fields);
      } catch (error) {
        // if the input data cannot be transformed into DataFrame
        console.error('error: ', error);
        return [];
      }
    }

    const advices = dataFrameToAdvices(this.ckb, this.ruleBase, this.dataFrame, options);

    return advices;
  }

  getCKB() {
    return this.ckb;
  }

  getRuleBase() {
    return this.ruleBase;
  }

  private processCKBCfg(ckbCfg: CKBConfig) {
    let ckb: Record<string, ChartKnowledgeJSON> = {};

    // step 1: exclude charts from default CKB
    const defaultCKB = CKBJson('en-US', true);
    let defaultCKBExcluded: Record<string, ChartKnowledgeJSON> = {};
    const toExclude = ckbCfg.exclude;
    if (toExclude) {
      Object.keys(defaultCKB).forEach((chart: string) => {
        if (!toExclude.includes(chart)) {
          // charts not being excluded
          defaultCKBExcluded[chart] = defaultCKB[chart];
        }
      });
    } else {
      defaultCKBExcluded = defaultCKB;
    }

    // step 2: only include charts from default CKB after excluded
    let defaultCKBIncluded: Record<string, ChartKnowledgeJSON> = {};
    if (ckbCfg.include) {
      let included = ckbCfg.include;
      if (toExclude) {
        included = included.filter((t: string) => !toExclude.includes(t));
      }
      included = included.filter((t: string) => !Object.keys(defaultCKBIncluded).includes(t));
      included.forEach((chart) => {
        if (Object.keys(defaultCKBExcluded).includes(chart)) {
          // check the chart is not excluded in the prev step
          defaultCKBIncluded[chart] = defaultCKBExcluded[chart];
        }
      });
    } else {
      defaultCKBIncluded = defaultCKBExcluded;
    }

    // step 3: combine default charts and customized charts
    ckb = {
      ...defaultCKBIncluded,
      ...ckbCfg.custom,
    };

    return ckb;
  }

  private processRuleCfg(ruleCfg?: RuleConfig) {
    if (!ruleCfg) {
      // no specific rule configuration -> return default rules
      return getChartRules(builtInRules);
    }

    // step 1: remove excluded rule
    const ruleBase = getChartRules(builtInRules);
    if (ruleCfg.exclude) {
      // have `exclude` definition
      const toExclude = ruleCfg.exclude;
      toExclude.forEach((id: string) => {
        if (Object.keys(ruleBase).includes(id)) {
          delete ruleBase[id];
        }
      });
    }

    // step 2: remove rules that are not included
    if (ruleCfg.include) {
      const toInclude = ruleCfg.include;
      Object.keys(ruleBase).forEach((id: string) => {
        if (!toInclude.includes(id)) {
          delete ruleBase[id];
        }
      });
    }

    // step 3: combine ruleBase and custom rules
    const finalRuleBase = {
      ...ruleBase,
      ...ruleCfg.custom,
    };

    // step 4: check options
    const { options } = ruleCfg;
    if (options) {
      const ruleWithOption = Object.keys(options);
      ruleWithOption.forEach((rule: string) => {
        if (Object.keys(finalRuleBase).includes(rule)) {
          const ruleOption = options[rule];
          finalRuleBase[rule] = {
            ...finalRuleBase[rule],
            option: ruleOption,
          };
        }
      });
    }

    return finalRuleBase;
  }
}

export * from './advice-pipeline';
