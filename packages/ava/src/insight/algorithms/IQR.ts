import { ascending } from './base/compare';

export interface IQRParams {
  k: number;
}

const getQuartilePercentValue = (array: number[], percent: number) => {
  const product = percent * array.length;
  const ceil = Math.ceil(product);

  if (ceil === product) {
    if (ceil === 0) {
      return array[0];
    }
    if (ceil === array.length) {
      return array[array.length - 1];
    }
    return (array[ceil - 1] + array[ceil]) / 2;
  }
  return array[ceil - 1];
};

interface IQRResult {
  upper: {
    threshold: number;
    indexes: number[];
  };
  lower: {
    threshold: number;
    indexes: number[];
  };
}

export const IQR = (data: number[], params?: IQRParams): IQRResult => {
  const k = params?.k || 1.5;

  const sorted = data.slice().sort(ascending);

  const q25 = getQuartilePercentValue(sorted, 0.25);
  const q75 = getQuartilePercentValue(sorted, 0.75);

  const iqr = q75 - q25;

  const outliers: IQRResult = {
    upper: {
      threshold: 0,
      indexes: [],
    },
    lower: {
      threshold: 0,
      indexes: [],
    },
  };

  outliers.lower.threshold = q25 - k * iqr;
  outliers.upper.threshold = q75 + k * iqr;

  data.forEach((item, index) => {
    if (item <= outliers.lower.threshold) {
      outliers.lower.indexes.push(index);
    } else if (item >= outliers.upper.threshold) {
      outliers.upper.indexes.push(index);
    }
  });

  return outliers;
};
