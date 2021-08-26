import { DataFrame, analyzer as DWAnalyzer } from '@antv/data-wizard';
import _intersection from 'lodash/intersection';
import { DataType, FieldType, Datum, ImpactMeasure } from '../interface';
import { AggregatorMap } from '../utils/aggregate';

export type DataProperty =
  | (DWAnalyzer.NumberFieldInfo & { name: string; dataTypes: DataType[]; fieldType: FieldType })
  | (DWAnalyzer.DateFieldInfo & { name: string; dataTypes: DataType[]; fieldType: FieldType })
  | (DWAnalyzer.StringFieldInfo & { name: string; dataTypes: DataType[]; fieldType: FieldType });

export const dataToDataProps = (data: Datum[]): DataProperty[] => {
  if (!data) {
    throw new Error('Argument `data` is missing.');
  }
  const df = new DataFrame(data);
  const dataTypeInfos = df.info();
  const dataProps: DataProperty[] = [];

  dataTypeInfos.forEach((info) => {
    const dataTypes = [];
    if (DWAnalyzer.isNominal(info)) dataTypes.push('Nominal');
    if (DWAnalyzer.isOrdinal(info)) dataTypes.push('Ordinal');
    if (DWAnalyzer.isInterval(info)) dataTypes.push('Interval');
    if (DWAnalyzer.isDiscrete(info)) dataTypes.push('Discrete');
    if (DWAnalyzer.isContinuous(info)) dataTypes.push('Continuous');
    if (DWAnalyzer.isTime(info)) dataTypes.push('Time');

    const newInfo = {
      ...info,
      dataTypes: dataTypes as DataType[],
      fieldType: _intersection(['Interval', 'Continuous'], dataTypes)?.length ? 'measure' : 'dimension',
    };

    dataProps.push(newInfo as DataProperty);
  });

  return dataProps;
};

export const calculateImpactValue = (data: Datum[], measure: ImpactMeasure) => {
  const measureAggregator = AggregatorMap[measure.method];
  const value = measureAggregator(data, measure.field);
  return value;
};

/** calculate the reference values for impact measures  */
export const calculateImpactMeasureReferenceValues = (data: Datum[], measures?: ImpactMeasure[]) => {
  const referenceMap: Record<string, number> = {};
  measures?.forEach((measure) => {
    const measureKey = `${measure.field}@${measure.method}`;
    const value = calculateImpactValue(data, measure);
    referenceMap[measureKey] = value;
  });
  return referenceMap;
};
