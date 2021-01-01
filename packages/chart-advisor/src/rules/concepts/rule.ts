import { LevelOfMeasurement as LOM, ChartID as ChartType } from '@antv/knowledge';

/**
 * @public
 */
export type HardOrSoft = 'HARD' | 'SOFT';

/**
 * @public
 */
export interface DataProps {
  distinct?: number;
  count?: number;
  sum?: number;
  samples?: any[];
  levelOfMeasurements: LOM[];
  maximum?: any;
  minimum?: any;
  missing: number;
  name: string;
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
  dataProps: DataProps[];
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
const CHART_RULE_ID = [
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
  'all-can-be-spreadsheet',
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
