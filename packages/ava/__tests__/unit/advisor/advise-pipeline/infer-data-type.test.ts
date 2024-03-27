import { inferDataType } from '../../../../src/advisor/utils/infer-data-type';

describe('chart mapping', () => {
  test('chart mapping from CKB', () => {
    const spec = {
      type: 'interval',
      data: [
        { genre: 'Sports', sold: 275 },
        { genre: 'Strategy', sold: 115 },
        { genre: 'Action', sold: 120 },
        { genre: 'Shooter', sold: 350 },
        { genre: 'Other', sold: 150 },
      ],
      encode: {
        x: 'genre',
        y: 'sold',
      },
    };
    const dataType = inferDataType(spec.data, 'genre', undefined);

    const expectDataType = 'categorical';

    expect(dataType).toEqual(expectDataType);
  });
});
