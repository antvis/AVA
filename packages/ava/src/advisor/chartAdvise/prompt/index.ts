import { CKB, VISUAL_CHANNEL_DESCRIPTION } from '@ava/ckb/ckb-v2';
import { CHART_NAME, CHART_PURPOSE_NAME_MAP, FULL_AND_ABBR_CHART_NAME_MAP } from '@ava/constants';
import { ChartConfig, Data, Meta } from '@ava/types';

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
