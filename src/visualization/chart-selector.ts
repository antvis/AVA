/**
 * Chart type selector based on data and query
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig } from '../types';
import type { ChartType } from './types';

/**
 * Analyze data structure to help chart selection
 */
function analyzeDataStructure(data: any[]): string {
  if (!data || data.length === 0) {
    return '数据为空';
  }

  const sample = data[0];
  const fields = Object.keys(sample);
  const fieldTypes = fields.map((field) => {
    const value = sample[field];
    let type = '其他';
    if (typeof value === 'number') {
      type = '数值';
    } else if (typeof value === 'string') {
      type = '文本';
    }
    return `${field}: ${type}`;
  });

  return `
数据行数: ${data.length}
字段: ${fieldTypes.join(', ')}
示例数据: ${JSON.stringify(data.slice(0, 3), null, 2)}
`;
}

/**
 * Select appropriate chart type based on user query and data
 */
export async function selectChartType(
  query: string,
  data: any[],
  llmConfig: LLMConfig
): Promise<ChartType> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const dataInfo = analyzeDataStructure(data);

  const prompt = `你是一个图表推荐专家。根据用户的查询和数据特征，推荐最合适的图表类型。

## 用户查询
${query}

## 数据特征
${dataInfo}

## 图表类型选择指南
- 时间序列数据，展示趋势变化 → line (折线图) 或 area (面积图)
- 分类数据比较 → column (柱形图) 或 bar (条形图)
- 显示部分占整体的比例 → pie (饼图)
- 显示两个变量的关系 → scatter (散点图)
- 同时展示两个不同量级的数据 → dual-axes (双轴图)
- 显示数据分布 → histogram (直方图) 或 boxplot (箱线图)
- 多维度数据对比 → radar (雷达图)
- 展示流程转化率 → funnel (漏斗图)
- 显示累计效应 → waterfall (瀑布图)
- 显示百分比或进度 → liquid (水波图)
- 展示文本词频 → word-cloud (词云图)
- 显示集合关系 → venn (韦恩图)
- 显示层级数据占比 → treemap (矩阵树图)
- 展示流量流向 → sankey (桑基图)
- 展示详细数据明细 → table (表格)

请只回复图表类型的英文名称（如 line、column、pie 等），不要有其他内容。`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  const chartType = text.trim();
  
  // Validate that the chart type is valid
  const validChartTypes: ChartType[] = [
    'line', 'column', 'bar', 'pie', 'area', 'scatter', 'dual-axes',
    'histogram', 'boxplot', 'radar', 'funnel', 'waterfall', 'liquid',
    'word-cloud', 'violin', 'venn', 'treemap', 'sankey', 'table', 'summary',
  ];
  
  if (validChartTypes.includes(chartType as ChartType)) {
    return chartType as ChartType;
  }
  
  // Default to column chart if invalid
  return 'column';
}
