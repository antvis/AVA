import { DataStore } from './model';

import type { AdviseChartPipeline } from '../advisor/advise-chart-pipeline/pipeline';

export class DataProcessPlugin {
  dataStore!: DataStore;

  apply(pipeline: AdviseChartPipeline) {
    // @ts-ignore
    pipeline.stages.data.tapPromise('DataProcessPlugin', this.excute.bind(this));
  }

  async excute(ctx) {
    const rawData = ctx.dataStore.data?.rawData;
    this.dataStore = new DataStore({
      data: rawData,
      columns: [],
    });

    // 批量计算特征

    // 如果有意图，根据意图和特征切片

    // 如果无意图，根据字段相关度自动聚合切片，熵最大原则。相关度接近的分为一组，根据语义自动组合。
    // 是否需要 LLM ？考虑性能，是否可合并到 parser

    // 从每个切片组装推荐所需参数，data，metas(包含特征)，purpose

    // 推荐流程，可选输出结果以及解释（在 playground 场景）
  }
}
