import { ChartKnowledgeJSON } from '@antv/ckb';
import { CKBConfig } from '../src/advisor/ckb-config';
import { Advisor } from '../src/advisor';

describe('customized CKB', () => {
  const myChart: ChartKnowledgeJSON = {
    id: 'fufu_chart',
    name: 'fufuChart',
    alias: ['futuChart'],
    family: ['fufuCharts'],
    def: 'This chart is defined by fufu',
    purpose: ['Comparison', 'Composition', 'Proportion'],
    coord: ['Polar'],
    category: ['Statistic'],
    shape: ['Round'],
    dataPres: [
      { minQty: 1, maxQty: 1, fieldConditions: ['Nominal', 'Ordinal'] },
      { minQty: 1, maxQty: 1, fieldConditions: ['Interval'] },
    ],
    channel: ['Angle', 'Area', 'Color'],
    recRate: 'Use with Caution',
  };

  test('no ckb config input', () => {
    const myAdvisor = new Advisor();
    const finalCKB = myAdvisor.CKB;
    expect(Object.keys(finalCKB).length).toBe(52);
  });

  test('custom only', () => {
    const myCKBCfg: CKBConfig = {
      custom: {
        fufu_chart: myChart,
      },
    };
    const myAdvisor = new Advisor({ ckbCfg: myCKBCfg });
    const finalCKB = myAdvisor.CKB;
    expect(Object.keys(finalCKB).length).toBe(53);
  });

  test('include only', () => {
    const myCKBCfg: CKBConfig = {
      include: ['line_chart', 'pie_chart'],
    };
    const myAdvisor = new Advisor({ ckbCfg: myCKBCfg });
    const finalCKB = myAdvisor.CKB;
    expect(Object.keys(finalCKB).length).toBe(2);
  });

  test('exclude only', () => {
    const myCKBCfg: CKBConfig = {
      exclude: ['pie_chart'],
    };
    const myAdvisor = new Advisor({ ckbCfg: myCKBCfg });
    const finalCKB = myAdvisor.CKB;
    expect(Object.keys(finalCKB).length).toBe(51);
  });

  test('custom && exclude && include', () => {
    const myCKBCfg: CKBConfig = {
      exclude: ['pie_chart'],
      include: ['line_chart', 'pie_chart'],
      custom: {
        fufu_chart: myChart,
      },
    };
    const myAdvisor = new Advisor({ ckbCfg: myCKBCfg });
    const finalCKB = myAdvisor.CKB;
    expect(Object.keys(finalCKB).length).toBe(2);
  });

  test('custom && include', () => {
    const myCKBCfg: CKBConfig = {
      include: ['line_chart', 'pie_chart'],
      custom: {
        fufu_chart: myChart,
      },
    };
    const myAdvisor = new Advisor({ ckbCfg: myCKBCfg });
    const finalCKB = myAdvisor.CKB;
    expect(Object.keys(finalCKB).length).toBe(3);
  });

  test('custom && exclude', () => {
    const myCKBCfg: CKBConfig = {
      exclude: ['line_chart', 'pie_chart'],
      custom: {
        fufu_chart: myChart,
      },
    };
    const myAdvisor = new Advisor({ ckbCfg: myCKBCfg });
    const finalCKB = myAdvisor.CKB;
    expect(Object.keys(finalCKB).length).toBe(51);
    expect(finalCKB).toHaveProperty('fufu_chart');
  });

  test('conflict of exclude and include', () => {
    const myCKBCfg: CKBConfig = {
      exclude: ['line_chart', 'pie_chart'],
      include: ['line_chart', 'pie_chart'],
    };
    const myAdvisor = new Advisor({ ckbCfg: myCKBCfg });
    const finalCKB = myAdvisor.CKB;
    expect(Object.keys(finalCKB).length).toBe(0);
  });
});
