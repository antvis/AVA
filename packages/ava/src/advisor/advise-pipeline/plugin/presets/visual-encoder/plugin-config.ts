import type { AdvisorPluginType, VisualEncoderInput, VisualEncoderOutput } from '../../../../types';

export const visualEncoderPlugin: AdvisorPluginType<VisualEncoderInput, VisualEncoderOutput> = {
  name: 'defaultVisualEncoder',
  execute: (input) => {
    // todo 从 spec-generator 中拆分出来核心 encode 部分
    return input;
  },
};
