/**
 * Chart type advisor based on data and query
 *
 * Uses structured chart definitions to dynamically build prompts
 * and generateText with JSON output instructions for structured results.
 *
 * Data metadata processing (extractMetadata / formatDatasetInfo) is
 * handled by the caller (AVA class), not here. This module receives
 * a pre-formatted dataInfoStr string.
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import type { LLMConfig, ChartType, ChartTypeDefinition } from '../types';

/**
 * Structured definitions for all supported chart types.
 * Used to dynamically build the advisor prompt instead of hardcoding text.
 */
export const chartDefinitions: ChartTypeDefinition[] = [
  {
    type: 'line',
    nameZh: '折线图',
    nameEn: 'Line Chart',
    features: ['比较', '趋势分析'],
    useCases: ['展示数值随时间或有序类别的变化', '分析事物随时间变化的趋势'],
    dataRequirements: ['需要一个时间字段或分类字段', '至少一个数值字段'],
    limitations: ['变量数值大多情况下为 0 时不适用'],
  },
  {
    type: 'column',
    nameZh: '柱形图',
    nameEn: 'Column Chart',
    features: ['比较', '分布', '排名'],
    useCases: ['对分类数据进行数值比较', '尤其是当数值比较接近时'],
    dataRequirements: ['需要一个分类变量和一个数值变量'],
    limitations: ['不能是连续型变量'],
  },
  {
    type: 'bar',
    nameZh: '条形图',
    nameEn: 'Bar Chart',
    features: ['比较', '分布', '排名'],
    useCases: ['分类数据比较', '特别适合分类名称较长或分类数量较多的情况'],
    dataRequirements: ['需要一个分类变量和一个数值变量'],
    limitations: ['不适合显示连续型变量关系', '不适合强调趋势'],
  },
  {
    type: 'pie',
    nameZh: '饼图',
    nameEn: 'Pie Chart',
    features: ['占比', '成分分析'],
    useCases: ['显示组成部分占整体的比例', '强调某部分在整体中的占比'],
    dataRequirements: ['需要一个分类字段和一个数值字段', '分类应构成一个整体'],
    limitations: ['变量相互独立不构成整体时不适用', '不能表现趋势', '数值接近时难以分辨', '类别过多时（建议不超过 5 个）不适用'],
  },
  {
    type: 'area',
    nameZh: '面积图',
    nameEn: 'Area Chart',
    features: ['比较', '趋势分析'],
    useCases: ['体现连续自变量下数据趋势变化', '同时观察数据总量变化'],
    dataRequirements: ['需要时间序列或有序数据'],
    limitations: ['自变量不是顺序性变量时不适用'],
  },
  {
    type: 'scatter',
    nameZh: '散点图',
    nameEn: 'Scatter Chart',
    features: ['相关性分析', '分布'],
    useCases: ['发现两个变量之间的关系或趋势', '显示数据分布', '检测异常值'],
    dataRequirements: ['需要两个数值变量'],
    limitations: ['只有一个变量，或分类数据时不适用'],
  },
  {
    type: 'dual-axes',
    nameZh: '双轴图',
    nameEn: 'Dual Axes Chart',
    features: ['多维对比', '趋势分析'],
    useCases: ['同时展示两个不同量级的数据'],
    dataRequirements: ['需要多个数值序列'],
    limitations: [],
  },
  {
    type: 'histogram',
    nameZh: '直方图',
    nameEn: 'Histogram',
    features: ['分布分析'],
    useCases: ['显示数据分布'],
    dataRequirements: ['连续数值数据'],
    limitations: [],
  },
  {
    type: 'boxplot',
    nameZh: '箱线图',
    nameEn: 'Box Plot',
    features: ['分布分析', '异常检测'],
    useCases: ['显示数据分布和异常值'],
    dataRequirements: ['连续数值数据', '可按分类分组'],
    limitations: [],
  },
  {
    type: 'radar',
    nameZh: '雷达图',
    nameEn: 'Radar Chart',
    features: ['多维对比'],
    useCases: ['多维度数据对比'],
    dataRequirements: ['多个维度的数值数据'],
    limitations: [],
  },
  {
    type: 'funnel',
    nameZh: '漏斗图',
    nameEn: 'Funnel Chart',
    features: ['流程分析', '转化分析'],
    useCases: ['展示流程转化率'],
    dataRequirements: ['有序的分类数据和对应数值'],
    limitations: [],
  },
  {
    type: 'waterfall',
    nameZh: '瀑布图',
    nameEn: 'Waterfall Chart',
    features: ['增减变化分析'],
    useCases: ['显示累计效应'],
    dataRequirements: ['分类数据和增减数值'],
    limitations: [],
  },
  {
    type: 'liquid',
    nameZh: '水波图',
    nameEn: 'Liquid Fill Chart',
    features: ['进度展示', '占比'],
    useCases: ['显示百分比或进度'],
    dataRequirements: ['单个百分比数值'],
    limitations: [],
  },
  {
    type: 'word-cloud',
    nameZh: '词云图',
    nameEn: 'Word Cloud',
    features: ['词频分析', '热点展示'],
    useCases: ['展示文本词频'],
    dataRequirements: ['文本和对应频次'],
    limitations: [],
  },
  {
    type: 'violin',
    nameZh: '小提琴图',
    nameEn: 'Violin Plot',
    features: ['分布分析'],
    useCases: ['显示数据分布密度'],
    dataRequirements: ['连续数值数据'],
    limitations: [],
  },
  {
    type: 'venn',
    nameZh: '韦恩图',
    nameEn: 'Venn Diagram',
    features: ['集合交并关系'],
    useCases: ['显示集合关系'],
    dataRequirements: ['集合及其交集数据'],
    limitations: [],
  },
  {
    type: 'treemap',
    nameZh: '矩阵树图',
    nameEn: 'Treemap',
    features: ['层级占比', '结构分析'],
    useCases: ['显示层级数据占比'],
    dataRequirements: ['层级结构数据'],
    limitations: [],
  },
  {
    type: 'sankey',
    nameZh: '桑基图',
    nameEn: 'Sankey Diagram',
    features: ['流向分析'],
    useCases: ['展示流量流向'],
    dataRequirements: ['源、目标、流量数值'],
    limitations: [],
  },
  {
    type: 'table',
    nameZh: '表格',
    nameEn: 'Table',
    features: ['数据展示', '查找'],
    useCases: ['展示详细数据明细'],
    dataRequirements: ['任意结构化数据'],
    limitations: [],
  },
];

/** All valid chart type strings for the JSON output enum */
const allChartTypes = chartDefinitions.map(d => d.type);
const chartTypeList = [...allChartTypes, 'none'].map(t => `"${t}"`).join(', ');

/**
 * Build the advisor prompt dynamically from chartDefinitions
 */
function buildAdvisorPrompt(query: string, dataInfoStr: string): string {
  const chartDescriptions = chartDefinitions
    .map((chart) => {
      const lines = [
        `### ${chart.nameZh} (${chart.type})`,
        `- **功能**: ${chart.features.join('、')}`,
        `- **适用场景**: ${chart.useCases.join('；')}`,
        `- **数据要求**: ${chart.dataRequirements.join('；')}`,
      ];
      if (chart.limitations.length > 0) {
        lines.push(`- **不适用场景**: ${chart.limitations.join('；')}`);
      }
      return lines.join('\n');
    })
    .join('\n\n');

  return `你是一个图表推荐专家。根据用户的查询和数据特征，判断是否需要可视化，如果需要则推荐最合适的图表类型。

## 用户查询
${query}

## 数据特征
${dataInfoStr}

## 图表类型详细说明

${chartDescriptions}

## 推荐规则

1. **识别可视化意图**：检查用户查询是否包含可视化关键词（如：绘制、画图、展示图表、可视化、趋势、占比、分布、对比、排名等）
2. **分析数据特征**：
   - 是否包含时间字段？→ 考虑 line 或 area
   - 是否为分类数据比较？→ 考虑 column 或 bar
   - 是否需要展示占比？→ 考虑 pie（类别≤5）
   - 是否有两个数值变量？→ 考虑 scatter
   - 是否有层级结构？→ 考虑 treemap
   - 是否有流向关系？→ 考虑 sankey
3. **匹配场景**：根据用户意图和数据特征，选择最合适的图表类型
4. **考虑限制**：注意各图表的不适用场景，避免错误推荐

## 输出格式

只输出一个 chartType 值，不要其他内容，不要引号，不要解释。可选值: ${chartTypeList}
如果用户查询不包含可视化意图，输出 "none"。`;
}

/**
 * Advise appropriate chart type based on user query and pre-formatted data info.
 * The caller (AVA class) is responsible for formatting data metadata into a string
 * via formatDatasetInfo / formatDatasetInfoWithNonArray before calling this function.
 *
 * @param query - The user's natural language query
 * @param dataInfoStr - Pre-formatted data description string
 * @param llmConfig - LLM configuration
 * @returns Recommended ChartType, or null if no visualization is needed
 */
export async function adviseChartType(
  query: string,
  dataInfoStr: string,
  llmConfig: LLMConfig
): Promise<ChartType | null> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const prompt = buildAdvisorPrompt(query, dataInfoStr);

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  const raw = text.trim().replace(/^["']|["']$/g, '').toLowerCase();

  if (!raw || raw === 'none') return null;

  const match = allChartTypes.find(t => t === raw);
  return (match as ChartType) ?? null;
}
