import { LevelOfMeasurement as LOM } from '@antv/ckb';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { DataProperty } from '../../interface';

// FIXME remove once DW is ready
export class DataFrame {
  private dataFrame;

  private pDataProps: DataProperty[];

  constructor(data: any[], fields?: string[]) {
    // MOCK not true
    this.dataFrame = data;

    const dataTypeInfos = DWAnalyzer.typeAll(data, fields);
    const dataProps: DataProperty[] = [];

    dataTypeInfos.forEach((info) => {
      const lom = [];
      if (DWAnalyzer.isNominal(info)) lom.push('Nominal');
      if (DWAnalyzer.isOrdinal(info)) lom.push('Ordinal');
      if (DWAnalyzer.isInterval(info)) lom.push('Interval');
      if (DWAnalyzer.isDiscrete(info)) lom.push('Discrete');
      if (DWAnalyzer.isContinuous(info)) lom.push('Continuous');
      if (DWAnalyzer.isTime(info)) lom.push('Time');

      const newInfo = { ...info, levelOfMeasurements: lom as LOM[] };
      dataProps.push(newInfo as DataProperty);
    });
    this.pDataProps = dataProps;
  }

  get dataProps() {
    return this.pDataProps;
  }

  toJson() {
    // return JSON array data
    return this.dataFrame;
  }
}
