// 生成的图表配置类型
export interface ChartConfig {
  type: string;
  encode: {
    [property: string]: Array<{
      id: string;
      name: string;
      dataType: string;
    }>;
  };
  score?: number;
  explanation?: string;
}

export interface FinalChartConfig {
  type: string;
  encode: {
    [property: string]: string[];
  };
  score?: number;
  explanation?: string;
}

// 模型推荐的图表配置
export type LLMChartConfig = Pick<ChartConfig, 'type' | 'score' | 'explanation'>;
