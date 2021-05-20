import { Channel } from 'vega-lite/build/src/channel';
import { Encoding } from 'vega-lite/build/src/encoding';
import { VegaLite, ValueOf, Field } from '../interfaces';

type EncodingValueObject = ValueOf<Encoding<any>>;

type EncodingValueObjectKey = keyof EncodingValueObject;

/**
 * Convert from Vega-Lite to ASP.
 */
export function vl2asp(spec: VegaLite, fieldInfos: Field[]): string[] {
  const facts = [`mark(${spec.mark}).`];
  if ('data' in spec && 'url' in spec.data) {
    facts.push(`data("${spec.data.url}").`);
  }

  const encoding = spec.encoding || {};

  const channelNames = Object.keys(encoding) as Channel[];
  channelNames.forEach((channelName, index) => {
    const eid = `e${index++}`;
    facts.push(`encoding(${eid}).`);
    facts.push(`channel(${eid},${channelName}).`);

    let encFieldType = null;
    let encZero = null;
    let encBinned = null;

    // translate encodings
    const channel = encoding[channelName] || {};
    const fieldNames = Object.keys(channel) as EncodingValueObjectKey[];
    fieldNames.forEach((field) => {
      // TODO: any? never?
      const fieldContent: any = channel[field];

      // TODO: fieldtype, extent
      //  "fieldtype(horsepower, number).",
      //  "extent(horsepower, 46, 230).",
      if (field === 'type') {
        encFieldType = fieldContent;
      }
      if (field === 'bin') {
        encBinned = fieldContent;
      }
      if (field === 'scale') {
        // translate two boolean fields
        if ('zero' in fieldContent) {
          encZero = fieldContent.zero;
          if (fieldContent.zero) {
            facts.push(`zero(${eid}).`);
          }
        }
        if ('type' in fieldContent) {
          if (fieldContent.type == 'log') {
            facts.push(`log(${eid}).`);
          }
        }
        if ('domainMin' in fieldContent) {
          if (fieldContent.domainMin) {
            facts.push(`domain_min(${eid}).`);
          }
        }
      } else if (field === 'bin') {
        if (fieldContent.maxbins) {
          facts.push(`${field}(${eid},${fieldContent.maxbins}).`);
        } else {
          facts.push(`${field}(${eid},10).`);
        }
      } else if (field === 'field') {
        // 检测到field 之后 要把这个field对应的extent，cardinality，fieldtype push进facts
        // fields can have spaces and start with capital letters
        facts.push(`${field}(${eid},"${fieldContent}").`);

        const targetField = fieldInfos.find((field) => {
          return field.field === fieldContent;
        });
        if (targetField) {
          facts.push(`fieldtype("${fieldContent}",${targetField.fieldType}).`);
          if (targetField.fieldType === 'number') {
            facts.push(`extent("${fieldContent}",${targetField['min']?.toFixed()},${targetField['max']?.toFixed()}).`);
          }
          facts.push(`enc_cardinality(${eid},${targetField['cardinality']}).`);
        }
      } else {
        // translate normal fields
        if (field !== 'bin') {
          fieldContent && facts.push(`${field}(${eid},${fieldContent}).`);
        }
      }
    });

    if (encFieldType === 'quantitative' && encZero === null && encBinned === null) {
      facts.push(`zero(${eid}).`);
    }
  });

  return facts;
}
