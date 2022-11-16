import { BlockDescriptor } from './plugin-protocol.type';

export const createCustomBlockFactory = <CustomBlockSpec = any>(
  descriptor: Omit<BlockDescriptor<CustomBlockSpec>, 'isBlock'>,
): BlockDescriptor<CustomBlockSpec> => {
  return { ...descriptor, isBlock: true };
};
