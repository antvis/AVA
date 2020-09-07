import { initCharts } from '../../utils';
import { columnSpec } from '../../specs/column';
describe('Basic Column', () => {
  it('meta', async () => {
    const g2plotConfig = await initCharts(columnSpec, 'basic column spec');
    expect(g2plotConfig.chartType).toEqual('Column');
  });
});
