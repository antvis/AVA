import { ChartKnowledgeJSON, CKBJson } from '@antv/ckb';
import { DataFrame } from '@antv/data-wizard';
import { RuleConfig, RuleModule } from '../ruler/concepts/rule';
import { BasicDataPropertyForAdvice, processRuleCfg } from '../ruler';
import { dataToAdvices } from './advice-pipeline/data-to-advices';
import { CKBConfig } from './ckb-config';
import { AdvisorOptions } from './advice-pipeline/interface';

export interface AdviseParams {
  /** input data to advise */
  data: Record<string, any>[],
  /** customized dataprops to advise */
  dataProps?: BasicDataPropertyForAdvice[],
  /** data fields to focus, apply in `data` and `dataProps` */
  fields?: string[],
  /** advising options such as purpose, layout preferences */
  options?: AdvisorOptions
};

export class Advisor {
  /**
   * CKB used for advising
   */
  CKB: Record<string, ChartKnowledgeJSON>;

  /**
   * rule base used for advising
   */
  ruleBase: Record<string, RuleModule>;

  ckbCfg: CKBConfig;

  ruleCfg: RuleConfig;

  /**
   *
   * @param configuration for Advisor, including
   *
   * - ckbCfg: ckb configuration: `include`, `exclude`, `custom`.
   *  if not specified, used `@antv/ckb` as default
   * - ruleCfg: rule base configuration: `include`, `exclude`, `custom`, `options`.
   *  if not specified, used `ruler` as default
   */
  constructor(config: Partial<Pick<Advisor, 'ckbCfg' | 'ruleCfg'>> = {}) {
    Object.assign(this, config);
    let ckb: Record<string, ChartKnowledgeJSON> = {};
    if (this.ckbCfg) {
      ckb = this.processCKBCfg(this.ckbCfg);
    }
    this.CKB = this.ckbCfg ? ckb : CKBJson('en-US', true);
    this.ruleBase = processRuleCfg(this.ruleCfg);
  }

  /**
   * chart advising from input data
   * @param params paramters for advising
   */
  advise(params: AdviseParams) {
    const { data, dataProps, fields, options } = params;
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
    let dataPropsForAdvice: BasicDataPropertyForAdvice[];
    if (dataProps) {
      // filter out fields that are not included for advising
      dataPropsForAdvice = fields ? dataProps.filter((dataProp: BasicDataPropertyForAdvice) => fields.includes(dataProp.name)) : dataProps;
    } else {
      dataPropsForAdvice = dataFrame.info() as BasicDataPropertyForAdvice[];
    }

    // filter out fields that are not included for advising
    let filteredData: Record<string, any>[] = [];
    if (fields) {
      filteredData = data.map((row: Record<string, any>)=>{
        const filteredRow = row;
        Object.keys(filteredRow).forEach(col => {
          if (!fields.includes(col)) {
            delete filteredRow[col];
          }
        });
        return row;
      });
    } else {
      filteredData = data;
    }
    const advices = dataToAdvices(filteredData, dataPropsForAdvice, this.CKB, this.ruleBase, options);

    return advices;
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
