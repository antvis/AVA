import { isParentChild } from '../../../../../data';
import { compare, hasSubset, intersects } from '../../../../utils';
import { LEVEL_OF_MEASUREMENTS, type LevelOfMeasurement } from '../../../../../ckb';

import type { BasicDataPropertyForAdvice } from '../../../../types';

type ReturnField = BasicDataPropertyForAdvice | undefined;

export const getFieldByLoM = ({
  dataProps = [],
  levelOfMeasurements,
  count = 1,
}: {
  dataProps: BasicDataPropertyForAdvice[];
  levelOfMeasurements: LevelOfMeasurement[];
  count?: number;
}) => {
  return dataProps.filter((field) => intersects(field.levelOfMeasurements, levelOfMeasurements)).slice(0, count);
};

export const splitFields = (dataProps: BasicDataPropertyForAdvice[] = [], filteredFieldNames: string[] = []) => {
  const filteredFields = dataProps.filter((field) => !filteredFieldNames.includes(field.name));
  const levelOfMeasurementFieldMap: Partial<Record<LevelOfMeasurement, BasicDataPropertyForAdvice>> = {};
  LEVEL_OF_MEASUREMENTS.forEach((levelOfMeasurement) => {
    const [field] = getFieldByLoM({ dataProps: filteredFields, levelOfMeasurements: ['Nominal'] });
    levelOfMeasurementFieldMap[levelOfMeasurement] = field;
  });
  return levelOfMeasurementFieldMap;
};

export function splitAngleColor(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField] {
  const splittedFields = splitFields(dataProps);
  const field4Color =
    splittedFields.Nominal ?? splittedFields.Ordinal ?? splittedFields.Time ?? splittedFields.Interval;
  const usedFieldKey = field4Color?.name ? [field4Color?.name] : [];
  const filteredFieldsMap = splitFields(dataProps, usedFieldKey);
  const field4Angle =
    filteredFieldsMap.Interval ?? filteredFieldsMap.Nominal ?? filteredFieldsMap.Ordinal ?? splittedFields.Time;
  return [field4Color, field4Angle];
}

export function splitLineXY(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField, ReturnField] {
  const field4X =
    dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal', 'Nominal'])) ??
    dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  const field4Y = dataProps
    .filter((field) => field !== field4X)
    .find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  const field4Color = dataProps
    .filter((field) => field !== field4X && field !== field4Y)
    .find((field) => intersects(field.levelOfMeasurements, ['Nominal', 'Ordinal', 'Time']));
  return [field4X, field4Y, field4Color];
}

export function splitAreaXYSeries(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField, ReturnField] {
  const field4X = dataProps.find((field) => intersects(field.levelOfMeasurements, ['Time', 'Ordinal']));
  const field4Series = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, field4Series];
}

export function splitBarXYSeries(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField, ReturnField] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);
  const field4Y = sortedNominalFields[0];
  const field4Series = sortedNominalFields[1];
  const field4X = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, field4Series];
}

export function splitColumnXYSeries(dataProps: BasicDataPropertyForAdvice[]): [ReturnField, ReturnField, ReturnField] {
  const nominalFields = dataProps.filter((field) => hasSubset(field.levelOfMeasurements, ['Nominal']));
  const sortedNominalFields = nominalFields.sort(compare);

  let field4X;
  let Field4Series;
  if (isParentChild(sortedNominalFields[1]?.rawData, sortedNominalFields[0]?.rawData)) {
    [Field4Series, field4X] = sortedNominalFields;
  } else {
    [field4X, Field4Series] = sortedNominalFields;
  }

  const field4Y = dataProps.find((field) => hasSubset(field.levelOfMeasurements, ['Interval']));
  return [field4X, field4Y, Field4Series];
}
