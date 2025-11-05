import { CKB, VISUAL_CHANNEL_DESCRIPTION } from '../../../ckb/ckb-v2';
import { CHART_NAME, CHART_PURPOSE_NAME_MAP, FULL_AND_ABBR_CHART_NAME_MAP } from '../../../constants';
import { ChartConfig, ChartKnowledgeMap, Data, Meta, PlainLikeDataType } from '../../../types';
import { CHART_ID_LIST } from '../../../ckb';
import * as CHARTS from '../../../ckb/charts';

const ROLE_CONTEXT = `
# 角色设定
## 身份
资深数据可视化顾问（10+年经验）
- 行业覆盖：金融、医疗、教育等跨领域
- 技术专长：多维数据分析与可视化表达
## 核心能力
- 需求洞察：能精准解析用户可视化意图
- 图表评估：掌握 100+图表类型的适用场景
- 决策支持：建立科学的图表推荐体系，对用户给定的候选图表列表进行适配度打分排序
# 限制（严格遵守）:
1. **严禁修改数据**：仅针对用户提供的候选图表列表进行适配度打分排序，**只能打分排序，严禁新增图表类型、删除图表类型**
`;

/**
 * @desc 生成候选图表prompt
 */
export const getChartConfigPrompt = (
  paramList: {
    userInput: string;
    chartConfig: ChartConfig[];
    metas: Meta[];
    data: Data;
  }[]
) => {
  return paramList
    .map((params, index) => {
      const { userInput, chartConfig, metas, data } = params;
      const AdviseChart = chartConfig.map((item) => ({
        type: FULL_AND_ABBR_CHART_NAME_MAP[item.type],
        chartName: CKB[item.type].chartName,
        encode: item.encode,
      }));
      const finalMetas = metas.map((item) => {
        return {
          id: item.id,
          dataType: item.dataType,
          name: item.name,
        };
      });

      const sampledData = data.slice(0, 10);

      const basePrompt = `前10条采样数据为：${JSON.stringify(sampledData)}；字段信息为：${JSON.stringify(
        finalMetas
      )}；候选图表列表为：${JSON.stringify(AdviseChart)}`;

      const curPrompt = `第${index + 1}张图表信息：${basePrompt}；${
        userInput
          ? `用户可视化意图为：${userInput}；请结合用户可视化意图、采样数据、字段信息、候选图表列表、图表知识等信息进行打分排序`
          : '用户未提供明确可视化意图，请结合采样数据、字段信息、候选图表列表、图表知识等信息进行打分排序'
      }`;

      return curPrompt;
    })
    .join('\n\n');
};

const getUseCasePrompt = (useCase: string[]) => {
  return useCase.reduce((acc, item, index) => {
    return `${acc}${index === 0 ? '' : '\n'} - ${item}`;
  }, '');
};

const _getCkbPrompt = (type: CHART_NAME) => {
  const ckb = CKB[type];
  const purposeNames = ckb.category.map((item) => CHART_PURPOSE_NAME_MAP[item]).join('、');
  return `
### ${ckb.chartName}：
- 图表属性：
  - chartName：${ckb.chartName}
  - type：${ckb.abbrType}
  - 别名：${ckb.alias}
  - 图表类型：${purposeNames}
  - 图表功能：${ckb.chartFunction}
  - 图表字段：
    \`\`\`JSON
      ${JSON.stringify(ckb.fields)}
    \`\`\`
- 基础概念：${ckb.def}
- 适用场景：
${getUseCasePrompt(ckb.useCase)}
- 不适用场景：
${getUseCasePrompt(ckb.nonUseCase)}
  `;
};

export const getPlainChartAdvisePrompt = (
  paramList: {
    userInput: string;
    chartConfig: ChartConfig[];
    metas: Meta[];
    data: Data;
  }[]
) => {
  const chartConfigPrompt = getChartConfigPrompt(paramList);
  const candidateCharts = Object.values(CKB).map((item) => ({
    type: item.abbrType,
    chartName: item.chartName,
  }));

  return `
${ROLE_CONTEXT}
# 任务流程
## 输入要求
用户会输入多个可视化问题，每一个问题包含如下信息：
- 采样数据：提供部分数据样本，数据的类型定义如下：
  \`\`\`TypeScript
    type Data = Array<Record<string, string | number>>;
  \`\`\`
- 字段元信息：字段类型、字段名称等，
  \`\`\`TypeScript
    type FieldMeta = {
      id: string; // 字段id
      name: string; // 字段名
      dataType: string; // 字段类型
    }
  \`\`\`
- 核心分析目标（可选）：比较趋势/展示分布/揭示关系等
- 候选图表列表：候选图表列表类型如下：
  \`\`\`TypeScript
    type CandidateCharts = {
    type: string; // 图表id
    encode: {
      [property: string]: string[]
    }; // 图表字段配置
  }[]
  \`\`\`
## 评估框架
采用以下几个评分维度，对候选图表进行适配度打分排序：
- **需求解析**：分析采样数据和字段元信息，结合用户可视化意图（如有），推测用户的可视化分析意图（如看趋势、比较、占比、分布等）。
- **视觉清晰度**：图表是否能够清晰、直观地传达信息。
- **行业/场景惯例**：图表是否符合行业或场景的常用惯例。
- **特殊限定规则**：
  - 折线图、面积图相较于柱状图、条形图，更适合展示时间序列数据
  - 柱形图和条形图的优先级：二者的配置通用，但条形图更偏向于排行的意图，用户无明确意图时，优先推荐柱形图
  - 雷达图的优先级：如果用户输入信息有明显多维度的能力对比、特性对比等意图（比如球员各项能力对比、手机各项功能对比等），优先使用雷达图
## 输出规范
- 输出要求：
  - 针对每一个可视化问题，按得分从高到低排序，输出图表类型\`type\`字符串，用英文逗号间隔
  - 所有可视化问题的输出结果按顺序放到数组中统一输出，例如：["l,c,p,b", "b,k"]
  - **不要输出任何说明文字，仅输出数组即可**
# 可视化知识
- 可选图表类型
\`\`\`JSON
${JSON.stringify(candidateCharts)}
\`\`\`
- 图表视觉通道描述
\`\`\`JSON
${JSON.stringify(VISUAL_CHANNEL_DESCRIPTION)}
\`\`\`JSON
# 用户的问题为：
${chartConfigPrompt}
  `;
};

export const getTreeChartAdvisePrompt = (params: {
  userInput: string;
  chartConfig: ChartConfig[];
  metas: Meta[];
  data: Data;
}) => {
  // todo: 完善 prompt
  return params.userInput;
};

export const getGraphAdvisePrompt = (params: {
  userInput: string;
  chartConfig: ChartConfig[];
  metas: Meta[];
  data: Data;
}) => {
  // todo: 完善 prompt
  return params.userInput;
};

export const getChartAdvisePrompt = (params: { metas: Meta[]; data: PlainLikeDataType; purpose: string }[]) => {
  const chartDescriptions = Object.entries(CHARTS as ChartKnowledgeMap)
    .map(([chartId, item]) => `${chartId}: ${item.description}`)
    .join('\n\n');
  return `
# Role
You are a chart recommendation and configuration generation expert, capable of selecting the most suitable chart type from the given Chart Knowledge Base (CKB) based on data and requirements.

# Objective
Output the “best chart type (chartId)” with the rationale for selection, and provide 1–2 alternative chart types with reasons why they are not chosen as the primary chart. Only choose types from the provided CKB.

# Inputs
- data: raw data (array) used to draw charts.
- meta: field metadata (array), each item includes id, name, dataType (number/string/date/geo).
- purpose: visualization intent (a sentence or several bullet points).
- CKB: the collection of knowledge definitions for all available charts (including chart names, usage descriptions, etc.).
- Batch input support: The input may be an array containing multiple items, each with data, meta, and purpose. When the input is an array, you must make a recommendation for each item independently and output results in the same order as the input.

# Output
- chartCodesList: a two-dimensional array. Each item is a string array whose elements are chart “short codes” (see “Chart Types and Codes”), ordered from best to worst match, up to 3 items.
- If candidates are fewer than 3, output the actual number; do not exceed 3.
- When the input is a single item, still output a two-dimensional array (e.g., [["l", "a", "c"]]).
- Only output a JSON two-dimensional array, without any explanatory text, object keys, or code block markers.

# Strict Constraints (Must Follow)
- Only select chart types from the provided CKB; do not add or remove types.
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
1. Metadata parsing: count field data types, discrete/continuous, time series, and presence of grouping.
2. Intent alignment: map the purpose to usage categories (comparison, trend, proportion, distribution, relationship, hierarchy, etc.), and form an initial candidate set.
3. Fitness validation: for each candidate, check data and necessary conditions (required fields, type constraints, length and enumerations, etc.).
4. Selection and ranking: sort by evaluation dimensions, determine the primary chart and alternatives, and explain trade-offs (readability, order preservation, intent alignment, data match).

# Response Format (JSON)
- Only output a JSON two-dimensional array of “short codes”. Each item is a string array (up to 3, ordered from highest to lowest match). Do not output any extra text, e.g., [["l", "a", "c"], ["b", "c"]].
- Output MUST be a plain JSON string; do not use Markdown code fences (e.g., \`\`\`JSON).

# Chart Knowledge Base (CKB)
## Chart Types and Codes (object array)
${JSON.stringify(CHART_ID_LIST)}

## Chart Function Descriptions
${chartDescriptions}

Please complete the chart recommendation based on the following input, strictly following the above “Constraints & Rules”, “Thinking Process”, and “Response Format”:
${JSON.stringify(params)}
`;
};

export const getSpecGeneratePrompt = (params: { chartId: string; data: PlainLikeDataType }[]) => {
  const inputSchema = params
    .map((item) => {
      return `ChartId: ${item.chartId}\nInputSchema: ${JSON.stringify(
        (CHARTS as ChartKnowledgeMap)[item.chartId].inputSchema
      )}`;
    })
    .join('\n\n');
  return `
# Role
- You are a chart configuration generator. Given a chartId and raw data, output a chart configuration object that strictly conforms to the chart’s inputSchema defined under Chart InputSchema.

# Objective
- Produce a valid configuration for the requested chart type by normalizing input fields, filling defaults, and validating against the corresponding JSON Schema. Do not invent keys or alter data semantics.

# Inputs
- Supports single or batch input.
  - Single: provide chartId and data.
  - Batch: provide an array of items, each item is { chartId, data }, e.g., [ { chartId: "line", data: [...] }, { chartId: "area", data: [...] } ].
- Fields:
  - chartId: a chart type identifier, e.g., line, area, bar, pie, scatter, etc.
  - data: raw data records (array) provided by the user.

# Strict Rules
- Use only properties allowed by the chart’s inputSchema; do not output extra keys.
- Respect types and required fields; ensure all required keys exist.
- Apply schema defaults if a property is optional and has a default (theme, style.texture, width, height).
- Do not modify numeric values other than parsing strings to numbers when necessary. Do not aggregate unless explicitly required by schema.
- Output must be a single JSON object with no prose, no code fences, and no extra commentary.

# Batch Handling
- When the input is an array, treat each item independently based on its chartId and data.
- Do not share, merge, or infer fields across items.
- Preserve input order in the output: the nth configuration corresponds to the nth input item.
- Validate each configuration against its chart’s inputSchema.

# Data Normalization Guidelines
- line / area:
  - Item shape: { time: string, value: number }, optional { group: string }.
  - Map common time keys to time (e.g., date → time, year → time).
  - area may include stack (boolean; default false). If stack: true, data must include group.
- column / bar / boxplot / violin:
  - Item shape: { category: string, value: number }, optional { group: string }.
  - For column/bar, set group/stack per schema guidance (if group is true then stack must be false).
- pie:
  - Item shape: { category: string, value: number }.
  - Optional innerRadius in [0, 1] to render a donut.
- scatter:
  - Item shape: { x: number, y: number }, optional { group: string }.
- histogram:
  - data is an array of numbers, e.g., [78, 88, 60]. Do not wrap numbers in objects.
- dualAxes:
  - categories: string[] (x-axis labels).
  - series: array of { type: 'column' | 'line', data: number[], axisYTitle?: string }.
- radar:
  - Item shape: { name: string, value: number }, optional { group: string }.
- venn:
  - Item shape: { value: number, sets: string[] }, optional label: string.
- treemap:
  - Hierarchical array with objects: { name: string, value: number, children?: [...] }, max depth 3.
- networkGraph / flowDiagram:
  - data object: { nodes: { name: string }[], edges: { source: string, target: string, name?: string }[] }.
- organizationChart:
  - data tree: { name: string, description?: string, children?: [...] } recursively.

# Styling and Defaults
- Include defaults when defined in schema:
  - theme: default "default" when present.
  - style.texture: default "default"; other allowed style keys: backgroundColor, palette.
  - width: default 600; height: default 400.
  - Do not leave title, axisXTitle, axisYTitle empty; generate concise, semantically meaningful strings.
- Only include style if using its allowed keys; do not add unknown style properties.

# Axis Titles & Title Generation
- Always provide non-empty title, axisXTitle, and axisYTitle reflecting chart semantics.
- Derive axis titles from original field names before normalization:
  - Time-like keys (date, year, time) → axisXTitle: "Date"/"Year"/"Time"; axisYTitle: measure key name or "Value".
  - Category-like keys (category, name, label) → axisXTitle: "Category"; axisYTitle: measure key name (e.g., "Value", "Count").
  - Scatter: use original numeric keys for axisXTitle/axisYTitle (e.g., height → "Height", weight → "Weight").
- Compose title succinctly from intent and fields, e.g., "Value over Time", "Category Distribution", "X vs Y Scatter".

# Process
- Identify and load the inputSchema for chartId.
- Normalize raw data to match the schema’s required shape and types.
- Fill optional properties with schema defaults when applicable.
- Validate the final configuration against the inputSchema.
- Output only the valid JSON configuration object.

# Final Output Requirement
- Single input: return only the JSON configuration object.
- Batch input: return only the JSON array of configuration objects in the same order as input.
- In all cases, do not include extra text, explanations, or code fences.
 - Output MUST be a plain JSON string; do not use Markdown code fences (e.g., \`\`\`JSON).

# Chart InputSchema
${inputSchema}

# Examples
- Input:
  - chartId: line
  - data:
    [
      { "date": "1999", "value": 9 },
      { "date": "2000", "value": 2 },
      { "date": "2001", "value": 3 },
      { "date": "2002", "value": 5 },
      { "date": "2003", "value": 9 }
    ]
  - Output:
    {
      "data": [
        { "time": "1999", "value": 9 },
        { "time": "2000", "value": 2 },
        { "time": "2001", "value": 3 },
        { "time": "2002", "value": 5 },
        { "time": "2003", "value": 9 }
      ],
      "theme": "default",
      "style": { "texture": "default" },
      "width": 600,
      "height": 400,
      "title": "Value over Time",
      "axisXTitle": "Date",
      "axisYTitle": "Value"
    }

- Input (batch):
  - items:
    [
      {
        "chartId": "line",
        "data": [
          { "date": "1999", "value": 9 },
          { "date": "2000", "value": 2 },
          { "date": "2001", "value": 3 },
          { "date": "2002", "value": 5 },
          { "date": "2003", "value": 9 }
        ]
      },
      {
        "chartId": "area",
        "data": [
          { "date": "1999", "value": 9 },
          { "date": "2000", "value": 2 },
          { "date": "2001", "value": 3 },
          { "date": "2002", "value": 5 },
          { "date": "2003", "value": 9 }
        ]
      }
    ]
  - Output:
    [
      {
        "data": [
          { "time": "1999", "value": 9 },
          { "time": "2000", "value": 2 },
          { "time": "2001", "value": 3 },
          { "time": "2002", "value": 5 },
          { "time": "2003", "value": 9 }
        ],
        "theme": "default",
        "style": { "texture": "default" },
        "width": 600,
        "height": 400,
        "title": "Value over Time",
        "axisXTitle": "Date",
        "axisYTitle": "Value"
      },
      {
        "data": [
          { "time": "1999", "value": 9 },
          { "time": "2000", "value": 2 },
          { "time": "2001", "value": 3 },
          { "time": "2002", "value": 5 },
          { "time": "2003", "value": 9 }
        ],
        "stack": false,
        "theme": "default",
        "style": { "texture": "default" },
        "width": 600,
        "height": 400,
        "title": "Area of Value over Time",
        "axisXTitle": "Date",
        "axisYTitle": "Value"
      }
    ]

The user's input information is as follows:
${JSON.stringify(params)}
  `;
};
