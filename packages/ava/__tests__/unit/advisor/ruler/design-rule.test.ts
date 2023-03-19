import { Advisor } from '../../../../src/advisor';
import { barWithoutAxisMin } from '../../../../src/advisor/ruler/rules/bar-without-axis-min';

// design rule test
test('x-axis-line-fading', () => {
  const myAdvisor = new Advisor();
  const data = [
    { price: 520, year: 2005 },
    { price: 600, year: 2006 },
    { price: 1500, year: 2007 },
  ];
  const advices = myAdvisor.advise({ data, fields: ['price', 'year'], options: { refine: true } });
  const chartSpec = advices.filter((e) => e.type === 'line_chart')[0].spec;
  if (chartSpec) {
    const layerEnc = chartSpec.layer && 'encoding' in chartSpec.layer[0] ? chartSpec.layer[0].encoding : null;
    if (layerEnc) {
      expect(layerEnc.x).toHaveProperty('axis');
      expect(layerEnc.y).toHaveProperty('scale');
    }
  }
});

test('bar-without-axis-min', () => {
  // @ts-ignore
  expect(barWithoutAxisMin.trigger({ chartType: 'bar_chart' })).toBe(true);
});
