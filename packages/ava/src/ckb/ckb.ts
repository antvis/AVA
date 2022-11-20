import { base } from './base';

import type { PureChartKnowledgeBase, ChartKnowledgeBase } from './types';

/**
 * A cheap way to get a copy of base.
 */
function newBase(): PureChartKnowledgeBase {
  return JSON.parse(JSON.stringify(base));
}

/**
 * Configuration to pick, omit and customize CKB.
 * Priority: exclude > include, + custom.
 *
 * 用来摘选、剔除和自定义 CKB 的配置。
 * 优先级逻辑是：先从原装 CKB 中剔除`exclude`的部分，然后在剩余的图表类型中摘选出`include`的部分，
 * 最后额外加上自定义的图表类型。
 */
export type CkbConfig = {
  exclude?: string[];
  include?: string[];
  custom?: ChartKnowledgeBase;
};

/**
 * Process ckb config to given CKB object.
 *
 * 根据配置项处理 CKB 内容，得到最终使用的 CKB
 *
 * @param ckbCfg - CKB Configuration {@link CkbConfig}
 * @returns CKB for actual use
 */
function processCkbCfg(ckb: ChartKnowledgeBase, ckbCfg: CkbConfig): ChartKnowledgeBase {
  const ckbBase = ckb;
  const { exclude, include, custom } = ckbCfg;

  // step 1: exclude charts from original CKB.
  // ---
  // 步骤一：如果有 exclude 项，先从给到的 CKB 中剔除部分选定的图表类型
  if (exclude) {
    exclude.forEach((chartType: string) => {
      if (Object.keys(ckbBase).includes(chartType)) {
        delete ckbBase[chartType];
      }
    });
  }

  // step 2: only include charts from former CKB.
  // ---
  // 步骤二：如果有 include 项，则从当前（剔除后的）CKB中，只保留 include 中的图表类型。
  if (include) {
    Object.keys(ckbBase).forEach((chartType: string) => {
      if (!include.includes(chartType)) {
        delete ckbBase[chartType];
      }
    });
  }

  // step 3: concat customized charts, may add or override chart types.
  // ---
  // 步骤三：在处理后的 CKB 最后，加入（可能存在的）自定义图表类型，实现图表类型的添加或覆写。
  const finalCkbBase = {
    ...ckbBase,
    ...custom,
  };

  return finalCkbBase;
}

/**
 * Get a CKB object.
 *
 * @param ckbCfg - CKB Configuration {@link CkbConfig}
 * @public
 */
export function ckb(ckbCfg?: CkbConfig): ChartKnowledgeBase {
  const base = newBase();
  return ckbCfg ? processCkbCfg(base, ckbCfg) : base;
}
