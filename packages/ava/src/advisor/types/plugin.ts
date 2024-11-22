import { AdvisorPipelineContext } from './pipeline';
import { PipelineStage } from './stage';

/** 基础插件接口定义 */
export interface AdvisorPluginType<Input = any, Output = any> {
  /** 插件的唯一标识 */
  name: string;
  /** 插件运行的阶段，用于指定插件在 pipeline 的哪个环节运行 * */
  stage?: PipelineStage;
  type?: 'async' | 'sync';
  execute: (data: Input, context: AdvisorPipelineContext) => Output | Promise<Output>;
  /** 判断插件运行的条件 */
  condition?: (data?: Input, context?: AdvisorPipelineContext) => boolean | Promise<boolean>;
  // hooks
  onBeforeExecute?: (input: Input, context: AdvisorPipelineContext) => void | Promise<void>;
  onAfterExecute?: (output: Output, context: AdvisorPipelineContext) => void | Promise<void>;
  onLoad?: (context: AdvisorPipelineContext) => void | Promise<void>;
  onUnload?: (context: AdvisorPipelineContext) => void | Promise<void>;
}
