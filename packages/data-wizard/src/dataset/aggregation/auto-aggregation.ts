import { DataFrame } from '..';

import { aggregateDataFrame } from './utils';

export default class AutoAggregation {
  dataFrame: DataFrame;

  constructor(dataFrame: DataFrame) {
    this.dataFrame = dataFrame;
  }

  deDuplication() {
    const dimensions = this.dataFrame.axes[1].filter((name) => {
      const index = this.dataFrame.axes[1].indexOf(name);
      return !this.dataFrame.info()[index].levelOfMeasurements.includes('Interval');
    });
    const measures = this.dataFrame.axes[1].filter((index) => !dimensions.includes(index));
    return aggregateDataFrame(this.dataFrame, dimensions, measures);
  }
}
