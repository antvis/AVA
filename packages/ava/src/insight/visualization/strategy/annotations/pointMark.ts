import { PointPatternInfo } from "../../../types";


export const pointPatternAnnotationStrategy = (pattern: PointPatternInfo) => {
  // time series outlier
    const color = pattern.type === 'time_series_outlier' ? COLOR.outlier : COLOR.highlight;

 const pointMarker = [
      {
        type: 'dataMarker',
        position: [x, y],
        point: {
          style: {
            fill: '#fff',
            stroke: color,
          },
        },
        line: {
          length: 20,
        },
        autoAdjust: false,
      },
      ...annotationText(
        [
          {
            content: x,
          },
          {
            content: y,
            style: {
              fontWeight: BOLD,
            },
          },
        ],
        [x, y],
        -42
      ),
    ];
}
