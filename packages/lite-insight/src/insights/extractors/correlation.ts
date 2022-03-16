import { pcorrtest } from '@stdlib/stats';
import { Datum, Measure, CorrelationInfo } from '../../interface';

type CorrelationResult = {
  significance: number;
  pcorr: number;
};

export const findCorrelation = (x: number[], y: number[]): CorrelationResult => {
  const testResult = pcorrtest(x, y);
  // @ts-ignore Type Result is missing the "pcorr"
  const { rejected, pcorr } = testResult;

  if (rejected) {
    return {
      pcorr,
      significance: Math.abs(pcorr),
    };
  }
  return null;
};

export const extractor = (data: Datum[], dimensions: string[], measures: Measure[]): CorrelationInfo[] => {
  const xField = measures[0].field;
  const yField = measures[1].field;
  if (!data || !dimensions || data.length === 0) return [];
  const x = data.map((item) => item?.[xField] as number);
  const y = data.map((item) => item?.[yField] as number);
  const result = findCorrelation(x, y);
  if (result) {
    return [
      {
        ...result,
        type: 'correlation',
        measures: [xField, yField],
      },
    ];
  }
  return [];
};
