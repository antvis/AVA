import { LevelOfMeasurement as LOM } from '@antv/knowledge';
import * as DWAnalyzer from '@antv/dw-analyzer';
import { DataProperty } from './interface';

/**
 * Return Data Properties of dataset.
 *
 * @beta
 */
export function dataToDataProps(data: any[]): DataProperty[] {
  if (!data) {
    throw new Error('Argument `data` is missing.');
  }

  const dataTypeInfos = DWAnalyzer.typeAll(data);

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

  return dataProps;
}
