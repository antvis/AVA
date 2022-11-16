import { createPhraseFactory } from './createPhraseFactory';

import type { PhraseDescriptor, CustomPhraseDescriptor } from './plugin-protocol.type';

export const createCustomPhraseFactory = <MetaData = any>(
  descriptor: Omit<CustomPhraseDescriptor<MetaData>, 'isEntity'>
): PhraseDescriptor<MetaData> => createPhraseFactory(false)<MetaData>(descriptor);
