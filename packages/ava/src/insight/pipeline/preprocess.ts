import { intersection } from 'lodash';

import { DataFrame } from '../../data';
import { AggregatorMap } from '../utils/aggregate';

import type { Datum, ImpactMeasure, DataProperty } from '../types';

export function dataToDataProps(data: Datum[]): DataProperty[] {
  if (!data) {
    throw new Error('Argument `data` is missing.');
  }
  const df = new DataFrame(data);
  const dataTypeInfos = df.info();
  const dataProps: DataProperty[] = [];

  dataTypeInfos.forEach((info) => {
    const newInfo: DataProperty = {
      ...info,
      domainType: intersection(['Interval', 'Continuous'], info.levelOfMeasurements)?.length ? 'measure' : 'dimension',
    };

    dataProps.push(newInfo);
  });

  return dataProps;
}

export function calculateImpactValue(data: Datum[], measure: ImpactMeasure) {
  const measureAggregator = AggregatorMap[measure.method];
  const value = measureAggregator(data, measure.fieldName);
  return value;
}

/** calculate the reference values for impact measures  */
export function calculateImpactMeasureReferenceValues(data: Datum[], measures?: ImpactMeasure[]) {
  const referenceMap: Record<string, number> = {};
  measures?.forEach((measure) => {
    const measureKey = `${measure.fieldName}@${measure.method}`;
    const value = calculateImpactValue(data, measure);
    referenceMap[measureKey] = value;
  });
  return referenceMap;
}
