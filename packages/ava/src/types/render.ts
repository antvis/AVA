export type TrendData = Array<{
  time: string;
  value: number;
  group?: string;
}>;

export type DistributionData = Array<{
  category: string;
  value: number;
  group?: string;
}>;

export type ComparisonData = Array<{
  name: string;
  value: number;
  group: number;
}>;

export type DataTypeMap = {
  TREND: TrendData;
  DISTRIBUTION: DistributionData;
  COMPARISON: ComparisonData;
};
