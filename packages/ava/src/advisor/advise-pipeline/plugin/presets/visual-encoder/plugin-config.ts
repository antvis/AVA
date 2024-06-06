import type { PluginType, VisualEncoderInput } from '../../../../types';

export const visualEncoderPlugin: PluginType<VisualEncoderInput, VisualEncoderInput> = {
  name: 'defaultVisualEncoder',
  stage: ['encode'],
  execute: (input) => {
    // todo 从 spec-generator 中拆分出来核心 encode 部分
    return input;
  },
};
