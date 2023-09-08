import type { CSSProperties } from 'react';

/** common props for block ele and inline ele */
export type CommonProps = {
  styles?: CSSProperties;
  className?: string;
  key?: string;
};

/** basic block element structure, used for extends */
export type CustomBlockElement = CommonProps & {
  // customType is required for custom block structure
  customType: string;
  metadata?: BlockMetaData;
  [key: string]: unknown;
};

/** custom phrase metadata */
export type CustomMetaData = {
  // customType is required for custom block structure
  customType: string;
  [key: string]: unknown;
};

/** block element (section,paragraph) metadata info */
export type BlockMetaData = Partial<{
  /** if element is generate by loop */
  loopId: string;
  // TODO 之后这里还会扩展条件判断等...
}>;
