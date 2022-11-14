// CKB
export {
  ckb, // the main CKB API
  ckbDict, // translate
  CkbConsts, // namespace of constants
  CkbTypes, // namespace of types
} from './ckb';

// NTV(Narrative Text Vis)
export { NtvTypes } from './ntv';
// for advanced user
export {
  generateTextSpec,
  isCustomSection,
  isStandardSection,
  isCustomParagraph,
  isTextParagraph,
  isBulletParagraph,
  getHeadingWeight,
  isHeadingParagraph,
  isEntityPhrase,
  isCustomPhrase,
  isTextPhrase,
  ENTITY_TYPES,
} from './ntv';
