// TODO: todo list for ckb
// 2. ckb 结构中增加 encode 相关的表达，把原来 ckb - spec 那一层手写的映射包掉
//    重新考虑 mark,channel,encode,shape 的关系和表述
// 3. 完善文档，重点透出：
//  a. 结构，并用几个简单图表类型做示例。并提供推荐最常用的图表类型 id（比如最常用的 10 个）
//  b. EIC（exclude,include,custom）用法
//  c. 图表类型分割的具体逻辑（比如 单色柱状图、多色柱状图 是否是两个id？条形图、柱状图呢？为什么）

import * as CkbTypes from './types';

// the main CKB API - ckb
export { ckb } from './ckb';
// CKB i18n functions
export { ckbDict } from './i18n';
// CKB constants
export * from './constants';
// CKB types
export { CkbTypes };
