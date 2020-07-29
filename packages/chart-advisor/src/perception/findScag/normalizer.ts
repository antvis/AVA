import _ from 'underscore';

export class Normalizer {
  public normalizedPoints: any[];
  public points: any[];
  dataX: any;
  dataY: any;
  maxX: number;
  minX: number;
  maxY: number;
  minY: number;
  rangeX: number;
  rangeY: number;
  normalizedX: number[];
  normalizedY: number[];

  constructor(points: any[]) {
    this.points = points.slice(0);
    let [dataX, dataY] = ([this.dataX, this.dataY] = _.unzip(this.points));

    let maxX = (this.maxX = _.max(dataX)),
      minX = (this.minX = _.min(dataX)),
      maxY = (this.maxY = _.max(dataY)),
      minY = (this.minY = _.min(dataY)),
      rangeX = (this.rangeX = maxX != minX ? maxX - minX : 1),
      rangeY = (this.rangeY = maxY != minY ? maxY - minY : 1),
      normalizedX = (this.normalizedX = dataX.map((x) => (x - minX) / rangeX)),
      normalizedY = (this.normalizedY = dataY.map((y) => (y - minY) / rangeY));

    this.normalizedPoints = _.zip(normalizedX, normalizedY);

    let length = this.points.length;
    for (let i = 0; i < length; i++) {
      this.normalizedPoints[i].data = this.points[i].data;
    }
  }

  normToPlot(points: any[]) {
    let oriplot = points.map((p) => {
      return this.normToPoint(p);
    });

    return oriplot;
  }

  normToPoint(point: any) {
    let midx = point[0],
      midy = point[1];
    let orix = this.minX + this.rangeX * midx,
      oriy = this.minY + this.rangeY * midy;

    return [orix, oriy];
  }
}
