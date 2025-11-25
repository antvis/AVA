import type { Properties } from 'csstype';

/** common props for block ele and inline ele */
export type CommonProps = {
  styles?: Properties;
  className?: string;
  key?: string;
};

/** basic block element structure, used for extends */
export type CustomBlockElement = CommonProps & {
  // customType is required for custom block structure
  customType: string;
  [key: string]: unknown;
};

/** custom phrase metadata */
export type CustomMetaData = {
  // customType is required for custom block structure
  customType: string;
  [key: string]: unknown;
};
