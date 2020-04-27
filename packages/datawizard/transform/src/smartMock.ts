import { type } from '@antv/dw-analyzer';
import { Random, TextRandom } from '@antv/dw-random';

/**
 *
 * @param sample
 * @todo optimize this temp funciton
 */
export function oneMoreValue(sample: any[]): any {
  const dataProps = type(sample);

  const isUnique = dataProps.count === dataProps.distinct;

  const tr = new TextRandom();
  const r = new Random();

  if (dataProps.recommendation === 'string') {
    if (isUnique) {
      // @ts-ignore
      return tr.word({ length: r.n(r.natural, 1, { min: dataProps.minLength, max: dataProps.maxLength })[0] });
    } else {
      return dataProps.samples[Math.floor(Math.random() * dataProps.samples.length)];
    }
  } else {
    return dataProps.samples[Math.floor(Math.random() * dataProps.samples.length)];
  }
}
