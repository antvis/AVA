import { TopLevelSpec } from 'vega-lite';

/**
 * @url <img url='https://vega.github.io/vega-lite/examples/bar.svg'/>
 */
export const columnSpec: TopLevelSpec = {
  data: {
    values: [
      { a: 'A', b: 28 },
      { a: 'B', b: 55 },
      { a: 'C', b: 43 },
      { a: 'D', b: 91 },
      { a: 'E', b: 81 },
      { a: 'F', b: 53 },
      { a: 'G', b: 19 },
      { a: 'H', b: 87 },
      { a: 'I', b: 52 },
    ],
  },
  mark: 'bar',
  encoding: {
    x: {
      field: 'a',
      type: 'nominal',
      // axis: { labelAngle: 0 }
    },
    y: {
      field: 'b',
      type: 'quantitative',
    },
  },
};
