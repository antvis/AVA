/**
 * part of vega lite typings
 * temporary copy here
 */

export type Mark =
  | 'area'
  | 'arc'
  | 'bar'
  | 'circle'
  | 'line'
  | 'point'
  | 'rect'
  | 'rule'
  | 'square'
  | 'text'
  | 'tick'
  | 'rect'
  | 'geoshape';

export type EncodingType = 'quantitative' | 'temporal' | 'ordinal' | 'nominal' | 'geojson';

export type EncodingKey =
  | 'x'
  | 'y'
  | 'x2'
  | 'y2'
  | 'column'
  | 'row'
  | 'longitude'
  | 'latitude'
  | 'longitude2'
  | 'latitude2'
  | 'theta'
  | 'theta2'
  | 'radius'
  | 'radius2'
  | 'color'
  | 'fill'
  | 'stroke'
  | 'opacity'
  | 'fillOpacity'
  | 'strokeOpacity'
  | 'strokeWidth'
  | 'strokeDash'
  | 'size'
  | 'angle'
  | 'shape'
  | 'detail'
  | 'text'
  | 'order';

// part of
export type Aggregation = 'count';

export type StackType = 'zero' | 'center' | 'normalize' | null | boolean;
