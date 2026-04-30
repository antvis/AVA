/**
 * Chart type advisor based on data and query
 */

import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

import { describeData } from '../data';

import type { LLMConfig, ChartType } from '../types';

/**
 * Advise appropriate chart type based on user query and data
 * Returns null if no visualization intent is detected
 */
export async function adviseChartType(
  query: string,
  data: unknown,
  llmConfig: LLMConfig
): Promise<ChartType | null> {
  const openai = createOpenAI({
    apiKey: llmConfig.apiKey,
    baseURL: llmConfig.baseURL,
  });

  const dataInfo = describeData(data);

  const prompt = `你是一个图表推荐专家。根据用户的查询和数据特征，判断是否需要可视化，如果需要则推荐最合适的图表类型。

## 用户查询
${query}

## 数据特征
${dataInfo}

## 图表类型详细说明

### 折线图 (line)
- **功能**: 比较、趋势分析
- **适用场景**: 展示数值随时间或有序类别的变化，分析事物随时间变化的趋势
- **数据要求**: 需要一个时间字段或分类字段，以及至少一个数值字段
- **不适用场景**: 变量数值大多情况下为 0

### 柱形图 (column)
- **功能**: 比较、分布、排名
- **适用场景**: 对分类数据进行数值比较，尤其是当数值比较接近时
- **数据要求**: 需要一个分类变量和一个数值变量
- **不适用场景**: 不能是连续型变量

### 条形图 (bar)
- **功能**: 比较、分布、排名
- **适用场景**: 分类数据比较，特别适合分类名称较长或分类数量较多的情况
- **数据要求**: 需要一个分类变量和一个数值变量
- **不适用场景**: 不适合显示连续型变量关系，不适合强调趋势

### 饼图 (pie)
- **功能**: 占比、成分分析
- **适用场景**: 显示组成部分占整体的比例，强调某部分在整体中的占比
- **数据要求**: 需要一个分类字段和一个数值字段，分类应构成一个整体
- **不适用场景**:
  - 变量相互独立不构成整体
  - 不能表现趋势
  - 数值接近时难以分辨
  - 类别过多（建议不超过 5 个）

### 面积图 (area)
- **功能**: 比较、趋势分析
- **适用场景**: 体现连续自变量下数据趋势变化，同时观察数据总量变化
- **数据要求**: 需要时间序列或有序数据
- **不适用场景**: 自变量不是顺序性变量

### 散点图 (scatter)
- **功能**: 相关性分析、分布
- **适用场景**: 发现两个变量之间的关系或趋势，显示数据分布，检测异常值
- **数据要求**: 需要两个数值变量
- **不适用场景**: 只有一个变量，或分类数据

### 双轴图 (dual-axes)
- **功能**: 多维对比、趋势分析
- **适用场景**: 同时展示两个不同量级的数据
- **数据要求**: 需要多个数值序列

### 直方图 (histogram)
- **功能**: 分布分析
- **适用场景**: 显示数据分布
- **数据要求**: 连续数值数据

### 箱线图 (boxplot)
- **功能**: 分布分析、异常检测
- **适用场景**: 显示数据分布和异常值
- **数据要求**: 连续数值数据，可按分类分组

### 雷达图 (radar)
- **功能**: 多维对比
- **适用场景**: 多维度数据对比
- **数据要求**: 多个维度的数值数据

### 漏斗图 (funnel)
- **功能**: 流程分析、转化分析
- **适用场景**: 展示流程转化率
- **数据要求**: 有序的分类数据和对应数值

### 瀑布图 (waterfall)
- **功能**: 增减变化分析
- **适用场景**: 显示累计效应
- **数据要求**: 分类数据和增减数值

### 水波图 (liquid)
- **功能**: 进度展示、占比
- **适用场景**: 显示百分比或进度
- **数据要求**: 单个百分比数值

### 词云图 (word-cloud)
- **功能**: 词频分析、热点展示
- **适用场景**: 展示文本词频
- **数据要求**: 文本和对应频次

### 小提琴图 (violin)
- **功能**: 分布分析
- **适用场景**: 显示数据分布密度
- **数据要求**: 连续数值数据

### 韦恩图 (venn)
- **功能**: 集合交并关系
- **适用场景**: 显示集合关系
- **数据要求**: 集合及其交集数据

### 矩阵树图 (treemap)
- **功能**: 层级占比、结构分析
- **适用场景**: 显示层级数据占比
- **数据要求**: 层级结构数据

### 桑基图 (sankey)
- **功能**: 流向分析
- **适用场景**: 展示流量流向
- **数据要求**: 源、目标、流量数值

### 表格 (table)
- **功能**: 数据展示、查找
- **适用场景**: 展示详细数据明细
- **数据要求**: 任意结构化数据

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

如果用户查询包含可视化意图，请只回复图表类型的英文名称（如 line、column、pie 等）。
如果用户查询不包含可视化意图，请回复"none"。
不要有其他内容。`;

  const { text } = await generateText({
    model: openai(llmConfig.model) as any,
    prompt,
  });

  const chartType = text.trim().toLowerCase();

  // Check if no visualization intent
  if (chartType === 'none' || chartType === '否' || chartType === 'no') {
    return null;
  }

  // Validate that the chart type is valid
  const validChartTypes: ChartType[] = [
    'line', 'column', 'bar', 'pie', 'area', 'scatter', 'dual-axes',
    'histogram', 'boxplot', 'radar', 'funnel', 'waterfall', 'liquid',
    'word-cloud', 'violin', 'venn', 'treemap', 'sankey', 'table', 'summary',
  ];

  if (validChartTypes.includes(chartType as ChartType)) {
    return chartType as ChartType;
  }

  // If invalid response but not explicitly "none", return null (no intent)
  return null;
}
