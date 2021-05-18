import { LevelOfMeasurement as LOM, ChartID as ChartType } from '@antv/knowledge';
import { FieldInfo } from '@antv/dw-analyzer';

/**
 * @public
 */
export type HardOrSoft = 'HARD' | 'SOFT';

/**
 * this minimum subset of pipeline/DataProperty, make pipeline can start with step2(dataPropsToAdvice)
 * @public
 */
export interface BasicDataPropertyForAdvice {
  /** field name */
  readonly name: string;
  /** LOM */
  readonly levelOfMeasurements: LOM[];
  /** used for split column xy series */
  readonly samples: any[];
  /** required types in analyzer FieldInfo */
  readonly recommendation: FieldInfo['recommendation'];
  readonly type: FieldInfo['type'];
  readonly distinct?: number;
  readonly count?: number;
  readonly sum?: number;
  readonly maximum?: any;
  readonly minimum?: any;
  readonly missing?: number;
}

/**
 * 偏好选项
 * @public
 */
export interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}

/**
 * @public
 */
export interface Info {
  chartType: ChartType;
  dataProps: BasicDataPropertyForAdvice[];
  purpose?: string;
  preferences?: Preferences;
  customWeight?: number;
  [key: string]: any;
}

/**
 * @public
 */
export type Validator = (args: Info) => number;

/**
 * @public
 */
export const CHART_RULE_ID = [
  'data-check',
  'data-field-qty',
  'no-redundant-field',
  'purpose-check',
  'series-qty-limit',
  'bar-series-qty',
  'line-field-time-ordinal',
  'landscape-or-portrait',
  'diff-pie-sector',
  'nominal-enum-combinatorial',
  'limit-series',
  'aggregation-single-row',
  'all-can-be-table',
] as const;

/**
 * @public
 */
export type ChartRuleID = typeof CHART_RULE_ID[number];

/**
 * @public
 */
export class Rule {
  private _id: ChartRuleID;
  private _hardOrSoft: HardOrSoft;
  private _specChartTypes: ChartType[];
  private _weight: number;
  private validator: Validator;

  constructor(
    id: ChartRuleID,
    hardOrSoft: HardOrSoft,
    specChartTypes: ChartType[],
    weight: number,
    validator: Validator
  ) {
    this._id = id;
    this._hardOrSoft = hardOrSoft;
    this._specChartTypes = specChartTypes;
    this._weight = weight;
    this.validator = validator;
  }

  get id(): string {
    return this._id;
  }

  get hardOrSoft(): HardOrSoft {
    return this._hardOrSoft;
  }

  get specChartTypes(): ChartType[] {
    return this._specChartTypes;
  }

  get weight(): number {
    return this._weight;
  }

  toString() {
    return `RULE: ${this._id}^${this._hardOrSoft}^${this._specChartTypes.toString()}^*${this.weight}`;
  }

  check(args: Info) {
    const weight = this._hardOrSoft === 'SOFT' ? args?.weight || this._weight : this._weight;
    return this.validator(args) * weight;
  }
}
