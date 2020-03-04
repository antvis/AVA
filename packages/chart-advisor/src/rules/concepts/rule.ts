import { LevelOfMeasurement as LOM, ChartID as ChartType } from '@antv/knowledge';

type HardOrSoft = 'HARD' | 'SOFT';

export interface DataProps {
  distinct?: number;
  count?: number;
  sum?: number;
  samples?: any[];
  levelOfMeasurements: LOM[];
}

/**
 * @public
 */
export interface Preferences {
  canvasLayout: 'landscape' | 'portrait';
}

interface Info {
  chartType: ChartType;
  dataProps: DataProps[];
  purpose?: string;
  preferences?: Preferences;
}

type Validator = (args: Info) => number;

class Rule {
  private _id: string;
  private _hardOrSoft: HardOrSoft;
  private _specChartTypes: ChartType[];
  private _weight: number;
  private validator: Validator;

  constructor(id: string, hardOrSoft: HardOrSoft, specChartTypes: ChartType[], weight: number, validator: Validator) {
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
    return this.validator(args) * this._weight;
  }
}

export default Rule;
