import { set } from 'lodash';

import {
  COLUMN_TYPE,
  Data,
  Meta,
  StatisticsFeatureKey,
  ChartLibrary,
  ChartPropertyRequirement,
  Operator,
  ChartConfig,
  AdviseChart,
  NumberColumnFeature,
  UiConfig,
} from '../../types';
import { CKB } from '../../ckb/ckb-v2';
import { logError, metasToMap } from '../../utils';
import { CHART_NAME, ABBR_AND_FULL_CHART_NAME_MAP } from '../../constants';
import { metaToSpec } from '../../render';

/**
 * @desc 对table组件的字段重新排序
 * @param metas
 * @returns
 */
export const sortTableRowsOrder = (metas: Meta[]): Meta[] => {
  const order = { date: 0, geo: 1, string: 2, number: 3 };
  const simpleMetas = metas.map((item) => {
    const { id, name, dataType } = item;
    return {
      id,
      name,
      dataType,
    };
  });
  return simpleMetas.sort((a, b) => {
    return order[a.dataType] - order[b.dataType];
  });
};

export const transformChartEncode = (encode: ChartConfig['encode']) => {
  return Object.entries(encode).reduce((acc, [key, value]) => {
    acc[key] = value.map((field) => field.id);
    return acc;
  }, {} as AdviseChart['encode']);
};

/**
 * @desc 返回可以生成有效配置的图表类型
 */
function getCompatibleChartIds(
  chartLibrary: ChartLibrary,
  fields: Meta[],
  fieldsByType: Record<string, Meta[]>
): string[] {
  const totalFields = fields.length;
  const dataTypes = Object.keys(fieldsByType);

  return Object.entries(chartLibrary)
    .filter(([chartId, chartInfo]) => {
      // 1. 检查图表是否能容纳所有字段
      const maxCapacity = Object.values(chartInfo.fields).reduce((sum, req) => sum + req.max, 0);
      if (maxCapacity < totalFields) {
        return false;
      }

      // 2. 检查每种数据类型的字段是否都能被分配
      const assignableDataTypes = new Set<string>();
      Object.values(chartInfo.fields).forEach((requirement) => {
        requirement.dataType.forEach((dataType) => assignableDataTypes.add(dataType));
      });

      // 检查是否有数据类型无法分配
      for (const dataType of dataTypes) {
        if (!assignableDataTypes.has(dataType)) {
          return false;
        }
      }

      // 3. 检查必选字段类型和数量是否满足
      for (const [, requirement] of Object.entries(chartInfo.fields)) {
        if (!requirement.optional) {
          // 计算符合此属性的字段总数
          let compatibleFieldCount = 0;
          for (const dataType of requirement.dataType) {
            compatibleFieldCount += (fieldsByType[dataType] || []).length;
          }

          // 如果可用字段数量小于最小要求，则图表不可用
          if (compatibleFieldCount < requirement.min) {
            return false;
          }
        }
      }

      if (chartId === CHART_NAME.table) {
        // table的配置简单不用参与计算，最后手动添加即可
        return false;
      }

      return true;
    })
    .map(([chartId]) => chartId);
}

/**
 * @desc 生成配置签名，用于检测重复配置（忽略字段顺序）
 * @param config 当前配置的字段分配方案
 * @returns 配置的唯一签名字符串
 */
function generateConfigSignature(config: Record<string, string[]>): string {
  const normalizedConfig: Record<string, string[]> = {};

  // 对每个属性的字段ID数组进行排序
  for (const [property, fieldIds] of Object.entries(config)) {
    normalizedConfig[property] = [...fieldIds].sort();
  }

  // 将属性按字母顺序排序，然后序列化
  return JSON.stringify(
    Object.keys(normalizedConfig)
      .sort()
      .reduce((obj, key) => {
        // eslint-disable-next-line no-param-reassign
        obj[key] = normalizedConfig[key];
        return obj;
      }, {} as Record<string, string[]>)
  );
}

/**
 * @desc 为图表配置计算评分，评分越高表示配置质量越好
 * @param config 图表配置
 * @param chartInfo 图表信息定义
 * @returns 配置评分（0-100分）
 */
function scoreConfiguration(
  config: ChartConfig,
  chartInfo: { fields: Record<string, ChartPropertyRequirement> }
): number {
  let score = 0;
  const { encode } = config;
  const usedPropertyCount = Object.keys(encode).length;
  const totalPropertyCount = Object.keys(chartInfo.fields).length;

  // 1. 使用的属性数量比例 (0-40分)
  // 使用的属性越多越好
  score += (usedPropertyCount / totalPropertyCount) * 40;

  // 2. 字段分布均匀度 (0-30分)
  const fieldCounts = Object.values(encode).map((fields) => fields.length);
  if (fieldCounts.length > 0) {
    const avgFieldCount = fieldCounts.reduce((sum, count) => sum + count, 0) / fieldCounts.length;
    const variance =
      // eslint-disable-next-line no-restricted-properties
      fieldCounts.reduce((sum, count) => sum + Math.pow(count - avgFieldCount, 2), 0) / fieldCounts.length;
    // 方差越小，分布越均匀，得分越高
    score += Math.max(0, 30 - variance * 10);
  }

  // 3. 可选属性使用情况 (0-20分)
  // 使用了更多可选属性的配置得分更高
  let optionalPropertiesUsed = 0;
  let totalOptionalProperties = 0;

  for (const [property, requirement] of Object.entries(chartInfo.fields)) {
    if (requirement.optional) {
      totalOptionalProperties++;
      if (encode[property] && encode[property].length > 0) {
        optionalPropertiesUsed++;
      }
    }
  }

  if (totalOptionalProperties > 0) {
    score += (optionalPropertiesUsed / totalOptionalProperties) * 20;
  } else {
    // 如果没有可选属性，则这部分得满分
    score += 20;
  }

  // 4. 单个属性字段数量 (0-10分)
  // 单个属性分配的字段越少越好
  let maxFieldsInProperty = 0;
  for (const fields of Object.values(encode)) {
    maxFieldsInProperty = Math.max(maxFieldsInProperty, fields.length);
  }

  // 如果最多的属性只有1个字段，得10分；如果有很多字段，得分降低
  score += Math.max(0, 10 - (maxFieldsInProperty - 1) * 2);

  return Math.round(score);
}

/**
 * @desc 检查剩余字段是否足够满足剩余必选属性的最小要求
 * @param remainingFields 剩余未分配的字段
 * @param remainingProperties 剩余未处理的属性名称
 * @param chartInfo 图表信息定义
 * @returns 是否能满足剩余必选属性的要求
 */
function canSatisfyRemainingRequirements(
  remainingFields: Meta[],
  remainingProperties: string[],
  chartInfo: { fields: Record<string, ChartPropertyRequirement> }
): boolean {
  // 按数据类型对剩余字段进行分组
  const fieldsByType: Record<string, number> = {};
  remainingFields.forEach((field) => {
    if (!fieldsByType[field.dataType]) {
      fieldsByType[field.dataType] = 0;
    }
    fieldsByType[field.dataType]++;
  });

  // 检查每个必选属性是否可能满足
  for (const property of remainingProperties) {
    const requirement = chartInfo.fields[property];
    if (!requirement.optional) {
      // 计算符合此属性的字段总数
      let compatibleFieldCount = 0;
      for (const dataType of requirement.dataType) {
        compatibleFieldCount += fieldsByType[dataType] || 0;
      }

      // 如果可用字段数量小于最小要求，则无法满足条件
      if (compatibleFieldCount < requirement.min) {
        return false;
      }
    }
  }

  return true;
}

/**
 * @desc 生成指定数量的元素组合，使用回调函数处理每个组合
 * @param items 待组合的元素数组
 * @param k 组合中元素的数量
 * @param callback 处理每个组合的回调函数
 */
function generateCombinations<T>(items: T[], k: number): T[][] {
  const result: T[][] = [];
  /**
   * @desc 递归生成组合的内部函数
   * @param start 开始索引
   * @param current 当前组合
   */
  function combine(start: number, current: T[]) {
    if (current.length === k) {
      result.push([...current]);
      return;
    }

    for (let i = start; i < items.length; i++) {
      current.push(items[i]);
      combine(i + 1, current);
      current.pop();
    }
  }

  combine(0, []);
  return result;
}

/**
 * @desc 计算剩余必选属性所需的最小字段数量
 * @param remainingProperties 剩余未处理的属性名称
 * @param chartInfo 图表信息定义
 * @returns 剩余必选属性所需的最小字段数
 */
function calculateRemainingRequiredFields(
  remainingProperties: string[],
  chartInfo: { fields: Record<string, ChartPropertyRequirement> }
): number {
  return remainingProperties.reduce((count, property) => {
    const requirement = chartInfo.fields[property];
    if (!requirement.optional) {
      // eslint-disable-next-line no-param-reassign
      count += requirement.min;
    }
    return count;
  }, 0);
}

/**
 * @desc 为指定图表类型生成最优配置，使用回溯算法枚举所有可能的字段分配方案
 * @param chartId 图表类型ID
 * @param chartInfo 图表信息定义
 * @param allFields 所有输入字段
 * @param fieldsByType 按数据类型分组的字段
 * @returns 按评分排序的配置数组，最多返回5个
 */
function generateTopConfigsForChart(
  chartId: string,
  chartInfo: {
    chartName: string;
    fields: Record<string, ChartPropertyRequirement>;
  },
  fields: Meta[]
): ChartConfig[] {
  const configs: ChartConfig[] = [];
  const configSignatures = new Set<string>(); // 用于检测重复配置
  const maxConfigs = 5; // 每种图表最多生成5种配置
  const timeLimit = 1000; // 设置1秒的时间限制
  const startTime = performance.now();
  let timeoutReached = false;
  const allFields = fields.map((item) => ({
    id: item.id,
    name: item.name,
    dataType: item.dataType,
  }));
  // 创建字段ID到字段对象的映射
  const fieldMap = new Map<string, Meta>();
  allFields.forEach((field) => {
    fieldMap.set(field.id, field);
  });

  // 获取图表的所有属性，并按优先级排序（必选属性优先）
  const chartProperties = Object.entries(chartInfo.fields)
    .sort(([, a], [, b]) => {
      // 首先按必选/可选排序
      if (a.optional !== b.optional) {
        return a.optional ? 1 : -1;
      }
      // 然后按最小要求数量排序（降序）
      return b.min - a.min;
    })
    .map(([key]) => key);

  // 预计算每个属性的兼容字段
  const compatibleFieldsByProperty: Record<string, Meta[]> = {};
  for (const property of chartProperties) {
    const requirement = chartInfo.fields[property];
    compatibleFieldsByProperty[property] = allFields.filter((field) => requirement.dataType.includes(field.dataType));
  }

  /**
   * @desc 回溯算法核心函数，递归尝试为每个图表属性分配字段
   * @param index 当前处理的属性索引
   * @param remainingFields 剩余未分配的字段
   * @param currentConfig 当前配置状态
   */
  function backtrack(index: number, remainingFields: Meta[], currentConfig: Record<string, string[]>) {
    // 检查时间限制
    if (performance.now() - startTime > timeLimit) {
      timeoutReached = true;
      return;
    }

    // 如果已经找到足够多的配置，停止搜索
    if (configs.length >= maxConfigs) {
      return;
    }

    // 如果已经处理完所有属性
    if (index === chartProperties.length) {
      // 如果所有字段都已分配，则添加到结果中
      if (remainingFields.length === 0) {
        // 生成配置签名（忽略字段顺序）
        const signature = generateConfigSignature(currentConfig);

        // 检查是否已存在相同的配置
        if (!configSignatures.has(signature)) {
          // 创建完整的字段对象
          const encode: Record<string, Array<Meta>> = {};

          for (const [property, fieldIds] of Object.entries(currentConfig)) {
            encode[property] = fieldIds.map((id) => fieldMap.get(id)!).filter(Boolean);
          }

          const config: ChartConfig = {
            type: chartId,
            encode,
          };

          // 计算配置评分
          config.score = scoreConfiguration(config, chartInfo);
          configs.push(config);
          configSignatures.add(signature);
        }
      }
      return;
    }

    const property = chartProperties[index];
    const requirement = chartInfo.fields[property];

    // 剪枝 - 检查剩余字段是否足够满足剩余必选属性
    if (!canSatisfyRemainingRequirements(remainingFields, chartProperties.slice(index), chartInfo)) {
      return;
    }

    // 使用预计算的兼容字段
    const compatibleFields = compatibleFieldsByProperty[property].filter((field) =>
      remainingFields.some((f) => f.id === field.id)
    );

    // 如果是可选属性且没有兼容字段，可以跳过
    if (requirement.optional && compatibleFields.length === 0) {
      backtrack(index + 1, remainingFields, currentConfig);
      return;
    }

    // 如果可用字段数量小于最小要求，则无法满足条件
    if (compatibleFields.length < requirement.min) {
      return;
    }

    // 生成从minCount到maxCount的所有可能组合
    const minCount = requirement.min;
    const maxCount = Math.min(requirement.max, compatibleFields.length);

    // 优先尝试最小数量（优先分散字段到不同属性）
    for (let count = minCount; count <= maxCount; count++) {
      if (configs.length >= maxConfigs || timeoutReached) {
        return;
      }
      const combos = generateCombinations(compatibleFields, count);
      for (const combination of combos) {
        if (configs.length >= maxConfigs || timeoutReached) {
          return;
        }
        const combinationIds = combination.map((field) => field.id);
        const newRemainingFields = remainingFields.filter((field) => !combination.includes(field));
        const remainingRequiredFields = calculateRemainingRequiredFields(chartProperties.slice(index + 1), chartInfo);
        if (newRemainingFields.length < remainingRequiredFields) {
          // eslint-disable-next-line no-continue
          continue;
        }
        const newConfig = { ...currentConfig };
        newConfig[property] = combinationIds;
        backtrack(index + 1, newRemainingFields, newConfig);
      }
    }
  }

  // 开始回溯
  backtrack(0, allFields, {});

  // 按评分排序，返回最多5个最优配置
  return configs.sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, maxConfigs);
}

/**
 * @desc Generate all possible chart configurations based on candidate fields
 */
export function generateAllChartConfigs(
  fields: Meta[],
  disabledCharts: string[] = [],
  enableCharts: string[] | null = null
): ChartConfig[] {
  const results: ChartConfig[] = [];
  const finalFields = fields.map((item) => ({
    id: item.id,
    name: item.name,
    dataType: item.dataType,
    statisticsFeature: item.statisticsFeature,
  }));

  const fieldsByType = finalFields.reduce<Record<string, Meta[]>>((acc, field) => {
    (acc[field.dataType] ||= []).push(field);
    return acc;
  }, {});

  const enableChartList = Object.keys(CKB).reduce((acc, key) => {
    const chart = CKB[key];
    const shouldAddChart = enableCharts ? enableCharts.includes(key) : !disabledCharts.includes(key);
    if (shouldAddChart) {
      acc[key] = chart;
    }
    return acc;
  }, {});
  // 先过滤出可能生成有效配置的图表类型
  const compatibleChartIds = getCompatibleChartIds(enableChartList, finalFields, fieldsByType);

  // 遍历所有兼容的图表类型
  compatibleChartIds.forEach((chartId) => {
    // 尝试为当前图表类型生成配置
    const configs = generateTopConfigsForChart(chartId, CKB[chartId], finalFields);
    if (configs.length > 0) {
      // 添加到结果中
      results.push(configs[0]);
    }
  });

  const shouldShowTable = enableCharts ? enableCharts.includes('table') : !disabledCharts.includes('table');
  if (shouldShowTable) {
    // table适配所有图表，默认添加
    results.push({
      type: CHART_NAME.table,
      encode: {
        row: sortTableRowsOrder(finalFields),
      },
      score: 10,
    });
  }

  results.forEach((chart) => {
    if (chart.type === 'radar') {
      const { encode } = chart;
      const x = encode.x[0];
      const s = encode.s?.[0];
      const metaMap = metasToMap(finalFields);
      if (s && metaMap[x.id]?.statisticsFeature?.distinct < metaMap[s.id]?.statisticsFeature?.distinct) {
        // eslint-disable-next-line no-param-reassign
        chart.encode = {
          ...encode,
          x: encode.s,
          s: encode.x,
        };
      }
    }
  });

  // 按评分从高到低排序
  return results.sort((a, b) => (b.score || 0) - (a.score || 0));
}

const validateWithOperator = (value: number, limit: number, operator: Operator): boolean => {
  switch (operator) {
    case Operator.GreaterThan:
      return value > limit;
    case Operator.LessThan:
      return value < limit;
    case Operator.Equals:
      return value === limit;
    case Operator.GreaterThanOrEqual:
      return value >= limit;
    case Operator.LessThanOrEqual:
      return value <= limit;
    case Operator.NotEquals:
      return value !== limit;
    default:
      throw new Error(`Unsupported operator: ${operator}`);
  }
};

/**
 * 将对象数组按number属性的100倍差异自动分组，保留原始对象
 * @param arr - 要分组的对象数组(必须包含id和number属性)
 * @param maxSpan - 组内最大允许跨度倍数 (默认10)
 * @returns 分组后的二维数组(保留原始对象)
 */
function groupByMagnitude(arr: { field: Meta; number: number }[], maxSpan: number = 100): Meta[][] | false {
  if (!Array.isArray(arr) || arr.length === 0) return [];

  // 先对数组按number值进行排序
  const sorted = [...arr]
    .map((item) => ({
      ...item,
      number: Math.abs(item.number),
    }))
    .sort((a, b) => a.number - b.number);
  const result: Meta[][] = [];
  let currentGroup: Meta[] = [sorted[0].field];
  let groupMin: number = sorted[0].number;

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const ratioToPrev = current.number / sorted[i - 1].number;
    const ratioToMin = current.number / groupMin;

    // 同时检查相邻比值和组内总跨度
    if (ratioToPrev <= 100 && ratioToMin <= maxSpan) {
      currentGroup.push(current.field);
    } else {
      result.push(currentGroup);
      currentGroup = [current.field];
      groupMin = current.number;
    }
  }

  // 添加最后一组
  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }

  if (result.length === 2) {
    //  字段值能分为两个量级，才能启用双轴图
    return result;
  }

  return false;
}

/**
 * @desc 根据字段特性评估图表配置
 * @param params
 * @returns
 */
export const optimizeChartConfig = (params: {
  chartConfigs: ChartConfig[];
  metas: Meta[];
  data: Data;
  uiConfig?: UiConfig;
}): AdviseChart[] => {
  const { chartConfigs, metas, data, uiConfig = {} } = params;
  const fieldsMap = metasToMap(metas);
  const processedConfigs = chartConfigs.map((config) => {
    const { type, encode, score } = config;
    let finalScore = score;
    const { limits } = CKB[type] || {};
    let isValid = true;
    let reason = '';
    if (limits) {
      // 1.遍历改图表所有的限制条件，比如distinctCount（去重维值数）
      isValid = Object.entries(limits).every(([limitKey, value]) => {
        const { number: expected, operator, params, reason: curReason } = value;
        let curTotalValue = 0;
        // 2.根据限制条件，计算出当前配置的特征值
        if (limitKey === StatisticsFeatureKey.distinct) {
          // 拆分数量约束，计算方式为所有分类字段的distinctCount乘积，再乘上指标字段数量
          const curCategoryCount =
            params?.category?.reduce((total, fieldKey) => {
              const curFieldTotalValue = encode[fieldKey]?.reduce((acc, cur) => {
                return acc * (fieldsMap[cur.id]?.statisticsFeature?.[limitKey] || 1);
              }, 1);
              return total * (curFieldTotalValue || 1);
            }, 1) || 1;

          const curMeasureCount =
            params?.measure?.reduce((acc, cur) => {
              return acc + encode[cur].length;
            }, 0) || 1;
          curTotalValue = curCategoryCount * curMeasureCount;
        }
        // TODO: 学任, 添加更多的限制条件
        reason = curReason;
        return validateWithOperator(curTotalValue, expected, operator);
      });
    }

    switch (type) {
      case CHART_NAME.dualAxes:
        try {
          // 双轴图重新分配字段, 将不同数量级的数据分到左右两个轴
          const allYFields = [...encode.y, ...encode.y2].map((field) => {
            const fieldInfo = fieldsMap[field.id];
            return fieldInfo;
          });
          const params = allYFields.map((item) => {
            const { statisticsFeature } = item;
            const median = (statisticsFeature as NumberColumnFeature)?.percentile50 || 0;
            return {
              field: item,
              number: median,
            };
          });
          const finalFields = groupByMagnitude(params);
          if (finalFields) {
            set(encode, 'y', finalFields[0]);
            set(encode, 'y2', finalFields[1]);
            finalScore += 100;
          } else {
            reason = '数据不能分成两个量级，降低适配度';
            isValid = false;
          }
        } catch (error) {
          logError('双轴图重新分配字段失败', error);
        }
        break;
      case CHART_NAME.kpiChart:
        if (data.length > 1) {
          reason = '指标卡只能展示单行数据';
          isValid = false;
        }
        break;
      case CHART_NAME.liquid:
        if (data.length > 1) {
          reason = '进度条只能展示单行数据';
          isValid = false;
        }
        break;
      case CHART_NAME.pie:
      case CHART_NAME.wordCloud: {
        const hasNegatives = metas.some((field) => {
          if (field.dataType === COLUMN_TYPE.number) {
            return (field.statisticsFeature as NumberColumnFeature)?.minimum < 0;
          }
          return false;
        });
        const hasOnlyOneData = data.length === 1;
        if (hasNegatives || hasOnlyOneData) {
          reason = '饼图不能展示负数或者不适合展示一条数据';
          isValid = false;
        }
        break;
      }
      case CHART_NAME.line:
      case CHART_NAME.area:
      case CHART_NAME.column:
      case CHART_NAME.bar: {
        try {
          const timeFiedId = encode.x[0].id;
          const timeField = fieldsMap[timeFiedId];
          if (timeField?.statisticsFeature?.distinct === 1) {
            reason = '单分类数据不适合用折线图、面积图、柱形图、条形图展示';
            isValid = false;
          }
        } catch (error) {
          logError('折线图、面积图、柱形图、条形图检查分类字段失败', error);
        }
        break;
      }
      default:
        break;
    }

    const finalEncode = transformChartEncode(encode);
    const explanation = config.explanation || '';
    return {
      type,
      encode: finalEncode,
      score: isValid ? finalScore : finalScore - 100, // 如果不满足字段特征扣分
      explanation: isValid ? explanation : `${explanation} ${reason}`,
    };
  });

  return processedConfigs
    .map((item) => {
      const { type, encode } = item;
      const spec = metaToSpec({
        type: type as CHART_NAME,
        encode,
        data,
        metas,
        uiConfig,
      });
      return {
        spec,
        ...item,
      };
    })
    .sort((a, b) => b.score - a.score);
};

/**
 * @desc 按模型推荐图表顺序对图表配置重新排序
 * @param chartConfig
 * @param LLMChartListStr
 * @returns
 */
export const sortChartConfigs = (chartConfig: ChartConfig[], LLMChartListStr: string): ChartConfig[] => {
  const allChartConfigMap = chartConfig.reduce((acc, cur) => {
    acc[cur.type] = cur;
    return acc;
  }, {});
  const LLMChartList = LLMChartListStr.split(',').reduce((acc, chartId, index) => {
    const finalChartId = ABBR_AND_FULL_CHART_NAME_MAP[chartId];
    const chartConfig = allChartConfigMap[finalChartId];
    if (chartConfig) {
      acc.push({
        ...chartConfig,
        score: 100 - index * 5,
      });
    }
    return acc;
  }, []);

  return LLMChartList.sort((a, b) => b.score - a.score);
};

export const getStatisticsFeature = (meta: Meta) => {
  const { dataType, statisticsFeature } = meta;
  if (!statisticsFeature) {
    return undefined;
  }
  if ([COLUMN_TYPE.date, COLUMN_TYPE.string, COLUMN_TYPE.geo].includes(dataType)) {
    return {
      [StatisticsFeatureKey.distinct]: statisticsFeature?.distinct,
    };
  }

  return {
    [StatisticsFeatureKey.median]: (statisticsFeature as NumberColumnFeature).percentile50,
  };
};
