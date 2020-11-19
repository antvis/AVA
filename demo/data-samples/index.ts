import { ChartID } from '@antv/knowledge';
import { DataSample } from './interfaces';
import { sample1 } from './sample1';
import { sample2 } from './sample2';
import { sample3 } from './sample3';
import { sample4 } from './sample4';
import { sample5 } from './sample5';
import { sample6 } from './sample6';
import { sample7 } from './sample7';
import { sample8 } from './sample8';
import { sample9 } from './sample9';
import { sample10 } from './sample10';
import { sample11 } from './sample11';
import { sample12 } from './sample12';

import { insightSamples } from './insightSamples';
import { perceptualSamples } from './perceptualSamples';
import { penguinsSamples } from './penguinsSamples';
import { irisSamples } from './irisSamples';

const sampleList: DataSample[] = [
  sample1,
  sample2,
  sample3,
  sample4,
  sample5,
  sample6,
  sample7,
  sample8,
  sample9,
  sample10,
  sample11,
  sample12,
];

type qty = 'First' | 'Random' | 'All';

export const DataSamples = {
  ForChartType: (type: ChartID, qty: qty = 'First') => {
    const filteredSamples = sampleList.filter((sample) => {
      if (!sample.props) {
        return false;
      }
      return sample.props.for.includes(type);
    });
    if (!filteredSamples || filteredSamples.length < 1) {
      return [];
    }

    let result: any = [];
    if (qty === 'First') {
      result = filteredSamples[0].data;
    } else if (qty === 'Random') {
      const randomIndex = Math.floor(Math.random() * Math.floor(filteredSamples.length));
      result = filteredSamples[randomIndex].data;
    } else if (qty === 'All') {
      result = filteredSamples.map((sample) => sample.data);
    }

    return result;
  },
};

export { insightSamples };
export { perceptualSamples };
export { irisSamples };
export { penguinsSamples };
