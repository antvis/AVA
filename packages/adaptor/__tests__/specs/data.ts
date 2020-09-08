import { TopLevelSpec } from 'vega-lite';

/**
 * @url <img url='https://vega.github.io/vega-lite/examples/bar.svg'/>
 */
export const urlDataSpec: TopLevelSpec = {
  height: { step: 17 },
  data: { url: 'https://vega.github.io/editor/data/population.json' },
  transform: [{ filter: 'datum.year == 2000' }],
  mark: 'bar',
  encoding: {
    y: { field: 'age' },
    x: {
      aggregate: 'sum',
      field: 'people',
      title: 'population',
    },
  },
};
