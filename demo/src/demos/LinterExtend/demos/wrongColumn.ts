import { G2PlotConfig } from '../../../packages/adaptor/src';

export const wrongColumn: G2PlotConfig = {
  type: 'column',
  options: {
    xField: 'type',
    yField: 'sales',
    label: {
      position: 'middle',
      style: {
        fill: '#FFFFFF',
        opacity: 0.6,
      },
    },
    xAxis: {
      label: {
        autoHide: true,
        autoRotate: false,
      },
    },
    yAxis: {
      minLimit: 20,
    },
    meta: {
      type: {
        alias: 'category',
      },
    },
    data: [
      {
        type: 'furniture',
        sales: 38,
      },
      {
        type: 'food',
        sales: 52,
      },
      {
        type: 'fruit',
        sales: 61,
      },
      {
        type: 'lights',
        sales: 145,
      },
      {
        type: 'kitchen',
        sales: 48,
      },
      {
        type: 'garden',
        sales: 38,
      },
      {
        type: 'drink',
        sales: 38,
      },
      {
        type: 'pets',
        sales: 38,
      },
    ],
  },
};
