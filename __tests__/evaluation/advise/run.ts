import { DataShard, Spec } from '../../../src/types';
import { requestTboxLLM } from '../../../src/utils';

const getPrompt = (input: string) => `
你是一名严格的中文数据抽取助手。目标是从给定文本中识别并抽取所有明确出现的数据信息，并返回一个标准化的 JSON 数组（只返回 JSON，不要任何解释）。

抽取范围包括但不限于：

- 数值：整数、小数、百分比、金额、温度、时长、数量、指数等。
- 时间：年份、月份、季度、日期、时间点（标准化为 YYYY、YYYY-MM、YYYY-MM-DD、Qx、HH:mm 等）。
- 维度：实体/类别/产品/城市/部门/指标名称等，作为数据的上下文属性。
输出要求：

- 仅抽取文本中明确出现的数据，不推断、不计算、不合并不同来源的值。
- 对同一指标的多时间点或多类别记录，逐条输出多条 JSON 记录。
- 保留并标准化单位（如 °C、%、元、万元、美元、件、人、小时）；百分比以数值存储（如“2.5%”→ value: 2.5），同时在 context 保留原文片段。
- 区间/范围值使用 value: { "min": x, "max": y }；若存在“约/超过/不足”等不确定词，将其记录在 dimension.qualifier。
- 金额中文数字（如“一百二十万”）需数字化为 1200000，同时保留币种单位。
- 方向性词（增长/下降/同比/环比）记录到 dimension.change_type；若为下降或负向变化，value 使用负号。
- 若文本中没有可抽取数据，返回空数组 []。
返回的 JSON 数组中，每个元素必须包含以下字段：
{
"name": "指标或数据项名称",
"value": 数值或对象（如区间 {"min":number,"max":number}），百分比用数值表示，
"unit": "单位字符串（无则空字符串）",
"time": "标准化时间字符串（无则空字符串）",
"dimension": { "维度名": "值", ... },  // 如 {"城市":"上海","产品":"A","类别":"B"}
"context": "来自原文的最短数据片段",
"confidence": 介于 0 和 1 的置信度数值
}

请严格遵守：

- 只返回有效 JSON；所有字符串使用双引号；不要添加注释或额外文本。
- 无法可靠解析的记录直接跳过；不要输出占位或空值记录。
- 保持原有数字精度，不进行四舍五入；保留负号与千分位信息（在 context 中）。
现在的输入文本：${input}`;

export const runAdviseRequests = async (
  data: {
    input: {
      type: string;
      value: string;
    };
    dataShard: DataShard[];
    chardIds: string[];
    specs: Spec;
  }[]
): Promise<string[]> => {
  const config = {
    appId: '202511APkFwG00560135',
    authorization: 'TBox-174d46eaa4374e96b3fd99b6fec527d7',
  };

  const results: string[] = [];
  for (const item of data) {
    const prompt = getPrompt(item.input?.value || '');
    const res = await requestTboxLLM({ config, prompt });
    results.push(res);
  }

  return results;
};
