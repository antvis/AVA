import { TopLevelSpec } from 'vega-lite';
import { flow } from '../utils';
import { data } from './data';
import { mark } from './mark';
import { encoding } from './encoding';

/**
 * use flow to handle vega lite spec step by step, order is **very** important
 * @param spec vega-lite spec
 * @returns {Promise<G2PlotConfigs>}
 *  use promise to handle error
 *  and support fetch data in case of vegaliteSpec.data is url string
 */
export const g2Adaptor = (spec: TopLevelSpec) => flow(data, mark, encoding)(spec, {});
