import { PhraseDescriptor, CustomPhraseDescriptor } from './plugin-protocol.type';
import { createPhraseFactory } from './createPhraseFactory';

export const createCustomPhraseFactory = <MetaData = any>(
  descriptor: Omit<CustomPhraseDescriptor<MetaData>, 'isEntity'>,
): PhraseDescriptor<MetaData> => createPhraseFactory(false)<MetaData>(descriptor);
