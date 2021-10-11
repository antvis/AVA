import { getSchemaByType, Lang } from '@antv/g2plot-schemas';
import * as schemaUtil from 'schema-util';

const SCHEMAS_CACHE = { 'zh-CN': {}, 'en-US': {} };

export default function getSchema(type: string, language: Lang) {
  if (!SCHEMAS_CACHE[language][type]) {
    const source = getSchemaByType(type, language);
    if (!source) return undefined;
    SCHEMAS_CACHE[language][type] = schemaUtil.schema(source);
    delete SCHEMAS_CACHE[language][type].properties.width;
    delete SCHEMAS_CACHE[language][type].properties.height;
  }
  return SCHEMAS_CACHE[language][type];
}
