/**
 * Chart type advisor: recommend a chart type from the query and a
 * pre-formatted data description string.
 */

import { generateText, type LanguageModelUsage } from 'ai';

import { languageModel } from '../util/model';

import { chartDefinitions } from './vis';

import type { LLMConfig, ChartType } from '../types';

const allChartTypes = chartDefinitions.map((d) => d.type);
const chartTypeSet = new Set(allChartTypes);
const chartTypeList = allChartTypes.map((t) => `"${t}"`).join(', ');
const chartDescriptions = chartDefinitions
  .map((chart) => {
    const lines = [
      `### ${chart.name} (${chart.type})`,
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

function buildAdvisorPrompt(query: string, dataInfoStr: string): string {
  return `你是一个图表推荐专家。根据用户的查询和数据特征，判断是否需要可视化，如果需要则推荐最合适的图表类型。

## 用户查询
${query}

## 数据特征
${dataInfoStr}

## 图表类型详细说明

${chartDescriptions}

## 推荐规则

按以下步骤依次判断，每一步命中第一个匹配的分支即可。

### 第一步：识别可视化意图

- 如果用户明确指定了图表类型：优先使用该类型；仅当数据明显无法支持时才改选更合适的类型。
- 否则，如果查询包含可视化意图（绘制、画图、图表、可视化、趋势、占比、分布、对比、排名、关系、转化、流向等）：继续下一步。
- 否则，如果只是查询具体数值、明细、单个结论或没有任何图表意图：输出 "none"。

### 第二步：分析数据特征

- 区分字段类型：时间字段、分类字段、数值字段、文本字段。数值型 ID、年份编码不是度量。
- 统计行数、分类数、系列数，并留意负值、空值和是否有序。
- 如果数据为空，或只有一行却要做趋势、对比、分布：输出 "none"。

### 第三步：根据意图匹配图表

- 趋势（随时间变化）：
  - 有两个量级差异很大的数值序列 → dual-axes
  - 需要体现总量且系列可叠加 → area
  - 否则 → line
- 对比 / 排名：
  - 分类名称较长，或分类数较多（约 8 个以上）→ bar
  - 否则 → column
- 占比 / 构成：
  - 数据有层级（父子结构）→ treemap
  - 单个百分比或进度 → liquid
  - 类别不超过 5 个且数值均为非负 → pie
  - 类别超过 5 个，或存在负值 → bar
- 两个数值变量的关系 / 相关性 → scatter
- 数值分布：
  - 单个连续数值字段的原始观测值 → histogram
  - 按分类对比分布且每类有多条观测值：关注异常值和分位数 → boxplot；关注分布密度 → violin
  - 每个分类只有一个值 → column
- 流程转化（有序阶段且数值递减）→ funnel
- 累计增减 / 构成总量的正负变化 → waterfall
- 流向（源、目标、数值）→ sankey
- 集合交并关系 → venn
- 文本词频 → word-cloud
- 多个维度对比同一对象（维度数适中，系列较少）→ radar
- 以上都不适用，或需要精确数值、明细、字段很多 → table

### 第四步：考虑限制

- 不要用 pie 展示趋势，不要用 line / area 展示无序分类。
- 连续数值的分布（薪资、成绩、年龄）用 histogram，不要用 column。
- 必须是数值的字段确实是数值；时间字段按升序排列。
- 最终类型必须符合其"数据要求"，且不在"不适用场景"内；不符合则回退到 column、bar 或 table。

## 输出格式

只输出一个 chartType 值，不要其他内容，不要引号，不要解释。可选值: ${chartTypeList}
如果用户查询不包含可视化意图，或数据无法支持任何图表，输出 "none"。`;
}

/**
 * Advise appropriate chart type based on user query and pre-formatted data info.
 *
 * @param query - The user's natural language query
 * @param dataInfoStr - Pre-formatted data description string
 * @param llmConfig - LLM configuration
 * @returns Recommended ChartType, or null if no visualization is needed
 */
export async function adviseChartType(
  query: string,
  dataInfoStr: string,
  llmConfig: LLMConfig,
  reportUsage?: (usage: LanguageModelUsage) => void
): Promise<ChartType | null> {
  const prompt = buildAdvisorPrompt(query, dataInfoStr);

  const { text, usage } = await generateText({
    model: languageModel(llmConfig),
    maxRetries: llmConfig.maxRetries ?? 3,
    prompt,
  });

  reportUsage?.(usage);

  const raw = text
    .trim()
    .replace(/^["']|["']$/g, '')
    .toLowerCase();

  if (!raw || raw === 'none') return null;

  return chartTypeSet.has(raw as ChartType) ? (raw as ChartType) : null;
}
