import cars from '../../common/data/cars.json';
// import movies from '../../common/data/movies.json';
// import weather from '../../common/data/weather.json';

export type DatasetName = 'cars'; // | 'movies' | 'weather';

export interface Example {
  name: string;
  datasetName: DatasetName;
  nodataspec: any;
}

export const DATASETS: Record<DatasetName, any> = {
  cars: cars,
  // movies: movies,
  // weather: weather,
};

export const EXAMPLES: Example[] = [
  {
    name: 'badsize',
    datasetName: 'cars',
    nodataspec: {
      mark: 'point',
      encoding: {
        x: {
          field: 'Horsepower',
          type: 'quantitative',
        },
        y: {
          field: 'Miles_per_Gallon',
          type: 'quantitative',
        },
        size: {
          field: 'Origin',
          type: 'nominal',
        },
      },
    },
  },
  {
    name: 'badx',
    datasetName: 'cars',
    nodataspec: {
      mark: 'bar',
      encoding: {
        x: {
          field: 'Acceleration',
          type: 'quantitative',
        },
        y: {
          field: 'Horsepower',
          type: 'quantitative',
        },
      },
    },
  },
  {
    name: 'badlogzero',
    datasetName: 'cars',
    nodataspec: {
      mark: 'bar',
      encoding: {
        x: {
          field: 'Acceleration',
          type: 'quantitative',
        },
        y: {
          field: 'Horsepower',
          type: 'quantitative',
          scale: {
            zero: true,
            type: 'log',
          },
        },
      },
    },
  },
];

export function fillValueDataSpec(spec: any, datasetName: DatasetName) {
  return {
    data: { values: DATASETS[datasetName] },
    ...spec,
  };
}

export function fillUrlDataFakeSpec(spec: any, datasetName: DatasetName) {
  return {
    data: { url: `my_data_path/${datasetName}.json` },
    ...spec,
  };
}
