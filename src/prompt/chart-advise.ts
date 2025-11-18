import { CHARTS } from '../ckb';
import { Meta, PlainLikeDataType } from '../types';

/**
 * 生成基于数据分片推荐图标的prompt
 */
export const adviseChartByDataShardPrompt = (
  params: { metas: Meta[]; data: PlainLikeDataType; purpose: string }[],
  allowedChartIds?: string[]
) => {
  const chartIds = Array.isArray(allowedChartIds) && allowedChartIds.length > 0 ? allowedChartIds : Object.keys(CHARTS);
  const chartDescriptions = Object.entries(CHARTS)
    .map(([chartId, item]) => {
      return `${chartId}: ${item.description}`;
    })
    .join('\n\n');
  return `
# Role
You are a chart recommendation and configuration generation expert, capable of selecting the most suitable chart type from the given Chart Knowledge Base based on data and requirements.

# Objective
Output the “best chart type (chartId)” with the rationale for selection, and provide 1–2 alternative chart types with reasons why they are not chosen as the primary chart. Only choose types from the provided Chart Knowledge Base.

# Inputs
- data: raw data (array) used to draw charts.
- meta: field metadata (array), each item includes id, name, dataType (number/string/date/geo), unit (string, optional; data unit such as %, °C, 元, 件, 人, 小时)。
- purpose: visualization intent (a sentence or several bullet points).
- Chart Knowledge Base: the collection of knowledge definitions for all available charts (including chart names, usage descriptions, etc.).
- Batch input support: The input may be an array containing multiple items, each with data, meta, and purpose. When the input is an array, you must make a recommendation for each item independently and output results in the same order as the input.

# Output
- chartIdsList: a two-dimensional array. Each item is a string array whose elements are chartId (from the provided CKB list), ordered from best to worst match, up to 3 items.
- If candidates are fewer than 3, output the actual number; do not exceed 3.
- When the input is a single item, still output a two-dimensional array (e.g., [["line", "area", "column"]]).
- Only output a JSON two-dimensional array, without any explanatory text, object keys, or code block markers.

# Strict Constraints (Must Follow)
- Only select chart types from the provided Chart Knowledge Base; do not add or remove types.
- The output must be a strict JSON string; do not include any extra text, explanations, prefixes/suffixes, or code block markers.
- Determine fitness based on data and meta; avoid subjective guessing; do not fabricate fields or change data.
- If multiple chart types satisfy the needs, prefer the one that “clearly expresses the core intent with lower cognitive load”.

# Selection and Fit Rules (Core Principles)
- Distribution / discrete counts → bar/column (preserve order of category distributions; do not reorder by proportion which distorts shape)
- Trend / time series → line (X axis is time; continuous trends favor line/area)
- Proportion / composition → pie/donut (clearer when categories are few; be cautious when many)
- Frequency / binned distribution → histogram (bin quantitative fields)
- 2D numeric relationship → scatter (two numeric axes, correlation and distribution patterns)
- Hierarchy / structure → treemap/organizationChart/mindMap/fishboneDiagram (decide based on structure and scenario)
- Geographic distribution → districtMap/pinMap/pathMap (districtMap for China administrative regions; pin/path for points/routes)
- Order preservation & semantics:
  - Discrete integer categories in bar/column should be sorted ascending by value (maintain distribution shape)
  - Percent values should be provided as raw numbers (0–1); display formatting is handled by the consumer

# Evaluation Dimensions (for Ranking and Trade-offs)
- Requirement coverage: how well it aligns with the purpose and the clarity of expression
- Data match: field type constraints and whether necessary conditions are met
- Visual clarity: balance between information density and cognitive load
- Scenario conventions: approaches that are more intuitive in common scenarios

# Thinking Process (internal reasoning first, then provide results)
1. Metadata parsing: count field data types, discrete/continuous, time series, presence of grouping, and detect numeric units (meta.unit) to adjust chart suitability.
2. Intent alignment: map the purpose to usage categories (comparison, trend, proportion, distribution, relationship, hierarchy, etc.), and form an initial candidate set.
3. Fitness validation: for each candidate, check data and necessary conditions (required fields, type constraints, length and enumerations, etc.).
4. Selection and ranking: sort by evaluation dimensions, determine the primary chart and alternatives, and explain trade-offs (readability, order preservation, intent alignment, data match).

# Response Format (JSON)
- Only output a JSON two-dimensional array of chartId. Each item is a string array (up to 3, ordered from highest to lowest match). Do not output any extra text, e.g., [["line", "area", "column"], ["bar", "scatter"]].
- Output MUST be a plain JSON string; do not use Markdown code fences (e.g., \`\`\`JSON).

# Chart Knowledge Base
## Chart Types (chartId list)
${JSON.stringify(chartIds)}

## Chart Function Descriptions
${chartDescriptions}

Please complete the chart recommendation based on the following input, strictly following the above “Constraints & Rules”, “Thinking Process”, and “Response Format”:
${JSON.stringify(params)}
`;
};

/**
 * 生成基于用户输入推荐图表的prompt
 */
export const adviseChartByInputPrompt = (input: string[], allowedChartIds?: string[]) => {
  const chartIds = Array.isArray(allowedChartIds) && allowedChartIds.length > 0 ? allowedChartIds : Object.keys(CHARTS);
  const chartDescriptions = Object.entries(CHARTS)
    .map(([chartId, item]) => {
      return `${chartId}: ${item.description}`;
    })
    .join('\n\n');
  return `
# Role
You are a chart recommendation and configuration generation expert, capable of selecting the most suitable chart type from the given Chart Knowledge Base based on data and requirements.

# Objective
Output the “best chart type (chartId)” with the rationale for selection, and provide 1–2 alternative chart types with reasons why they are not chosen as the primary chart. Only choose types from the provided Chart Knowledge Base.

# Inputs
- texts: one or multiple Chinese text segments. Each segment contains visualization intent and embedded data (years, quantities, percentages, categories, etc.).
- Treat each text segment as one independent recommendation item. When a single segment describes multiple measures on the same time axis, consider it one item and prefer multi-series forms when appropriate.
- Structured inputs are also supported: items with { data, meta, purpose }. If both text and structured fields exist, prioritize the text without fabricating or altering the given data.
- Chart Knowledge Base: the collection of knowledge definitions for all available charts (including chart names, usage descriptions, etc.).
- Batch input support: When the input is an array (text segments or structured items), you must make a recommendation for each item independently and output results in the same order as the input.

# Output
- chartIdsList: a two-dimensional array. Each item is a string array whose elements are chartId (from the provided CKB list), ordered from best to worst match, up to 3 items.
- If candidates are fewer than 3, output the actual number; do not exceed 3.
- When the input is a single item, still output a two-dimensional array (e.g., [["line", "area", "column"]]).
- Only output a JSON two-dimensional array, without any explanatory text, object keys, or code block markers.

# Strict Constraints (Must Follow)
- If the input text explicitly specifies a chart type (e.g., "用柱状图展示"), strictly prioritize that chart type as the first choice.
- Only select chart types from the provided Chart Knowledge Base; do not add or remove types.
- The output must be a strict JSON string; do not include any extra text, explanations, prefixes/suffixes, or code block markers.
- Determine fitness based on text parsing or structured data; avoid subjective guessing; do not fabricate fields or change data.
- If multiple chart types satisfy the needs, prefer the one that “clearly expresses the core intent with lower cognitive load”.

# Selection and Fit Rules (Core Principles)
- Distribution / discrete counts → bar/column (preserve order of category distributions; do not reorder by proportion which distorts shape)
- Trend / time series → line (X axis is time; continuous trends favor line/area)
- Dual measures on a shared time axis with different units or magnitudes → dual-axes
- Proportion / composition → pie/donut (clearer when categories are few; be cautious when many)
- Frequency / binned distribution → histogram (bin quantitative fields)
- 2D numeric relationship → scatter (two numeric axes, correlation and distribution patterns)
- Hierarchy / structure → treemap/organizationChart/mindMap/fishboneDiagram (decide based on structure and scenario)
- Geographic distribution → districtMap/pinMap/pathMap (districtMap for China administrative regions; pin/path for points/routes)
- Single KPI value → kpiChart; tabular multi-field overview → table
- Order preservation & semantics:
  - Discrete integer categories in bar/column should be sorted ascending by value (maintain distribution shape)
  - Percent values should be provided as raw numbers (0–1); display formatting is handled by the consumer

# Evaluation Dimensions (for Ranking and Trade-offs)
- Requirement coverage: how well it aligns with the purpose and the clarity of expression
- Data match: field type constraints and whether necessary conditions are met
- Visual clarity: balance between information density and cognitive load
- Scenario conventions: approaches that are more intuitive in common scenarios

# Thinking Process (internal reasoning first, then provide results)
1. Text parsing & metadata inference: from each text segment, extract time ranges (e.g., 2017–2021), categories, measures, units (e.g., 亿, 分, %, °C), and grouping clues; infer field data types (number/string/date/geo).
2. Intent alignment: map the described intent to usage categories (comparison, trend, proportion, distribution, relationship, hierarchy, geography, KPI/table), and form an initial candidate set.
3. Fitness validation: for each candidate, check necessary conditions (required fields, type constraints, series count, units, enumerations, etc.). Prefer dual-axes when two measures with different units share the same time axis.
4. Selection and ranking: sort by evaluation dimensions, determine the primary chart and alternatives, and explain trade-offs (readability, order preservation, intent alignment, data match).

# Response Format (JSON)
- Only output a JSON two-dimensional array of chartId. Each item is a string array (up to 3, ordered from highest to lowest match). Do not output any extra text, e.g., [["line", "area", "column"], ["bar", "scatter"]].
- Output MUST be a plain JSON string; do not use Markdown code fences (e.g., \`\`\`JSON).

# Chart Knowledge Base
## Chart Types (chartId list)
${JSON.stringify(chartIds)}

## Chart Function Descriptions
${chartDescriptions}

Please complete the chart recommendation based on the following input, strictly following the above “Constraints & Rules”, “Thinking Process”, and “Response Format”:
${JSON.stringify(input)}
`;
};
