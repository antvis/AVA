import { ChartKnowledgeJSON, CKBJson } from '@antv/ckb';
import { DataFrame, analyzer, GraphData } from '@antv/data-wizard';
import { RuleConfig, RuleModule } from '../ruler/concepts/rule';
import { BasicDataPropertyForAdvice, processRuleCfg } from '../ruler';
import { cloneDeep, deepMix } from './utils';
import { dataToAdvices } from './advice-pipeline/data-to-advices';
import { graphdataToAdvices } from './advice-pipeline/graph-to-advices';
import { CKBConfig } from './ckb-config';
import { AdvisorOptions, SmartColorOptions } from './advice-pipeline/interface';

export type AdviseParams = ChartAdviseParams | GraphAdviseParams;

export type ChartAdviseParams = {
  /** input data to advise */
  data: Record<string, any>[];
  /** customized dataprops to advise */
  dataProps?: BasicDataPropertyForAdvice[];
  /** data fields to focus, apply in `data` and `dataProps` */
  fields?: string[];
  /** SmartColor mode on/off */
  smartColor?: boolean;
  /** advising options such as purpose, layout preferences */
  options?: AdvisorOptions;
  /** smart color options */
  colorOptions?: SmartColorOptions;
};

export type GraphAdviseParams = {
  /** input data to advise */
  data:
    | {
        [key: string]: any;
      }[]
    // array object, such as { nodes: [], edges: [] }
    | {
        [key: string]: any[];
      }
    | {
        // Tree
        id: string | number;
        children: any[];
        [key: string]: any;
      };
  /** customized dataprops to advise */
  dataProps?: analyzer.GraphProps;
  /** data fields to focus, apply in `data` and `dataProps` */
  fields?: {
    nodes: string[];
    links: string[];
  };
  /** advising options such as purpose, layout preferences */
  options?: {
    purpose?: AdvisorOptions['purpose'];
    nodes?: AdvisorOptions;
    links?: AdvisorOptions;
    theme?: AdvisorOptions['theme'];
    nodeColors?: string[];
    nodeSizeRange?: number[];
    edgeWidthRange?: number[];
    extra?: {
      nodeKey?: string; // key for node array in data object
      edgeKey?: string; // key for edge array in data object
      sourceKey?: string; // key for edge source in edge object
      targetKey?: string;
      childrenKey?: string;
      nodeIndexes?: string[] | number[];
      nodeColumns?: string[] | number[];
      linkIndexes?: string[] | number[];
      linkColumns?: string[] | number[];
    };
  };
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
    const { data, options } = params;
    const purposeForGraphs = ['Relation', 'Hierarchy', 'Flow'];
    const keyForGraph = ['nodes', 'edges', 'links', 'from', 'to', 'children'];
    const hasKeyForGraph =
      Object.prototype.toString.call(data) === '[object Object]' &&
      Object.keys(data).some((key) => keyForGraph.includes(key));
    const shouldRecommendGraph =
      (options as GraphAdviseParams['options'])?.extra || purposeForGraphs.includes(options?.purpose) || hasKeyForGraph;
    let advices;
    const graphAdvices = this.advicesForGraph(params as GraphAdviseParams);
    // const chartAdvices = this.advicesForChart(params as ChartAdviseParams);
    // If shouldRecommendGraph is true, higher priority for relational graph
    if (shouldRecommendGraph) {
      advices = graphAdvices;
      // advices = graphAdvices.concat(chartAdvices)
    } else {
      const chartAdvices = this.advicesForChart(params as ChartAdviseParams);
      // Otherwise, higher priority for statistical charts
      advices = chartAdvices.concat(graphAdvices);
    }
    return advices;
  }

  advicesForChart(params: ChartAdviseParams) {
    const { data, dataProps, smartColor, options, colorOptions } = params;
    // otherwise the input data will be mutated
    const copyData = cloneDeep(data);
    const { fields } = params as ChartAdviseParams;
    // transform data into DataFrame
    let dataFrame: DataFrame;
    try {
      if (fields) {
        dataFrame = new DataFrame(copyData, { columns: fields });
      } else {
        dataFrame = new DataFrame(copyData);
      }
    } catch (error) {
      // if the input data cannot be transformed into DataFrame
      // eslint-disable-next-line no-console
      console.error('error: ', error);
      return [];
    }

    // get dataProps from dataframe
    let dataPropsForAdvice: BasicDataPropertyForAdvice[];
    if (dataProps) {
      // filter out fields that are not included for advising
      dataPropsForAdvice = fields
        ? dataProps.filter((dataProp: BasicDataPropertyForAdvice) => fields.includes(dataProp.name))
        : dataProps;
    } else {
      dataPropsForAdvice = dataFrame.info() as BasicDataPropertyForAdvice[];
    }

    // filter out fields that are not included for advising
    let filteredData: Record<string, any>[] = [];
    if (fields) {
      filteredData = copyData.map((row: Record<string, any>) => {
        const filteredRow = row;
        Object.keys(filteredRow).forEach((col) => {
          if (!fields.includes(col)) {
            delete filteredRow[col];
          }
        });
        return row;
      });
    } else {
      filteredData = copyData;
    }

    const advices = dataToAdvices(
      filteredData,
      dataPropsForAdvice,
      this.CKB,
      this.ruleBase,
      smartColor,
      options,
      colorOptions
    );
    return advices;
  }

  advicesForGraph(params: GraphAdviseParams) {
    const { data, dataProps, options } = params;
    const copyData = cloneDeep(data);
    let graphData;
    try {
      graphData = new GraphData(copyData, (options as GraphAdviseParams['options'])?.extra);
    } catch (error) {
      // if the input data cannot be transformed into DataFrame
      return [];
    }
    const calcedProps = graphData?.info();
    const graphDataProps = dataProps ? deepMix(calcedProps, dataProps) : calcedProps;
    const advicesForGraph = graphdataToAdvices(graphData.data, graphDataProps, options);
    return advicesForGraph;
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
      ...ckbCfg.custom,
    };

    return finalCkbBase;
  }
}

export * from './advice-pipeline';
export * from './ckb-config';
