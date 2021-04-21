import { DataProps } from './rule';
import { ChartID as ChartType } from '@antv/knowledge';
import { VegaLiteEncodingSpecification, SingleViewSpec } from '../../advice-pipeline/interface';

type Optimizer = (dataProps: DataProps[], chartTypeSpec: SingleViewSpec) => VegaLiteEncodingSpecification;

export class DesignRule {
  private _id: string;
  private _domain: ChartType[];
  private _optimizer: Optimizer;

  constructor(id: string, domain: ChartType[], optimizer: Optimizer) {
    this._id = id;
    this._domain = domain;
    this._optimizer = optimizer;
  }

  get id(): string {
    return this._id;
  }

  get domain(): ChartType[] {
    return this._domain;
  }

  get optimizer(): Optimizer {
    return this._optimizer;
  }

  toString() {
    return `DESIGN_RULE: ${this._id}`;
  }
}
