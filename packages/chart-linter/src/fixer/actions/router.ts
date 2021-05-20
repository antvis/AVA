import { cloneDeep } from 'lodash';
import { AnyMark } from 'vega-lite/build/src/mark';
import { Channel, AVAILABLE_MARKS, AVAILABLE_CHANNELS, AVAILABLE_AGG, AVAILABLE_P_TYPE } from '../../interfaces';
import { RuleID } from '../rules';
import { renameKey } from '../../utils';
import { pickMostSimilar } from './utils';
import { Apply } from './interfaces';

export const ACTION_ROUTER: Record<string, Apply> = {
  CHANGE_MARK: {
    token: 'CHANGE_MARK',
    type: 'equals',
    executor: ({ vl, action }) => {
      const { name: actionName } = action;
      const newVL = cloneDeep(vl);
      newVL.mark = actionName.split('_')[1].toLowerCase() as AnyMark;
      return newVL;
    },
  },
  CHANGE_CHANNEL: {
    token: 'CHANGE_CHANNEL',
    type: 'equals',
    executor: ({ vl, action, ruleID }) => {
      const { name: actionName } = action;
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding;
      const prevChannel = actionName.split('_')[1].toLowerCase() as Channel;
      const newChannel = actionName.split('_')[2].toLowerCase() as Channel;
      if (ruleID === 'repeat_channel' && newEncoding) {
        // repeat了channel 替换带有dupl标签的
        (Object.keys(newEncoding) as Channel[]).forEach((channel) => {
          if (channel.includes(`${prevChannel}_dupl_`)) {
            renameKey(newEncoding, channel, newChannel);
          }
        });
      } else {
        renameKey(newEncoding, prevChannel, newChannel);
      }
      return newVL;
    },
  },
  BIN: {
    token: 'BIN',
    type: 'equals',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (param1 && newEncoding && newEncoding[param1]) {
        newEncoding[param1]['bin'] = { maxbins: 10 };
      }
      return newVL;
    },
  },
  REMOVE_BIN: {
    token: 'REMOVE_BIN',
    type: 'equals',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (param1 && newEncoding[param1] && newEncoding[param1]['bin']) {
        delete newEncoding[param1]['bin'];
      }
      return newVL;
    },
  },
  AGGREGATE: {
    token: 'AGGREGATE',
    type: 'startswith',
    executor: ({ vl, action, ruleID }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (
        ruleID &&
        (['aggregate_not_all_continuous', 'stack_with_non_positional_non_agg'] as RuleID[]).includes(ruleID) &&
        param1
      ) {
        newEncoding[param1]['aggregate'] = 'min';
      }
      return newVL;
    },
  },
  REMOVE_AGGREGATE: {
    token: 'REMOVE_AGGREGATE',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (param1) {
        delete newEncoding[param1]['aggregate'];
      }
      return newVL;
    },
  },
  CHANGE_AGGREGATE: {
    token: 'CHANGE_AGGREGATE',
    type: 'startswith',
    executor: ({ vl, action, ruleID }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      switch (ruleID) {
        // hard(aggregate_o_valid,C,A) :- type(E,ordinal), aggregate(E,A), A != min, A != max, A != median, channel(E, C).
        case 'aggregate_o_valid':
          // hard(aggregate_t_valid,C,A) :- type(E,temporal), aggregate(E,A), A != min, A != max, channel(E, C).
          break;
        case 'aggregate_t_valid':
          newEncoding[param1]['aggregate'] = 'min';
          break;
        // hard(stack_without_summative_agg,C,A) :- stack(E,_), aggregate(E,A), not summative_aggregate_op(A), channel(E, C).
        // summative_aggregate_op(count;sum).
        case 'stack_without_summative_agg':
          newEncoding[param1]['aggregate'] = 'sum';
          break;
        default:
          break;
      }
      return newVL;
    },
  },
  ADD_COUNT: {
    token: 'ADD_COUNT',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (param1 && newEncoding && newEncoding[param1]) {
        newEncoding[param1]['aggregate'] = 'count';
      }
      return newVL;
    },
  },
  REMOVE_COUNT: {
    token: 'REMOVE_COUNT',
    type: 'startswith',
    executor: ({ vl, action, ruleID }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (ruleID === 'count_on_x_and_y') {
        delete newEncoding[param1]['aggregate'];
      } else {
        // FIXME: else
        delete newEncoding[param1]['aggregate'];
      }
      return newVL;
    },
  },
  REMOVE_LOG: {
    token: 'REMOVE_LOG',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (param1) {
        delete newEncoding[param1]['scale']['type']; // { "type": "log" }
      }
      return newVL;
    },
  },
  ZERO: {
    token: 'ZERO',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      // 需要加zero 说明原来写了"zero: false"
      if (param1) {
        delete newEncoding[param1]['scale']['zero'];
      }
      return newVL;
    },
  },
  REMOVE_ZERO: {
    token: 'REMOVE_ZERO',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      // 需要删除zero，说明zero在这个情况下的声明不合法
      if (param1) {
        delete newEncoding[param1]['scale']['zero'];
      }
      return newVL;
    },
  },
  STACK: {
    token: 'STACK',
    type: 'startswith',
    executor: ({ vl }) => {
      const newVL = cloneDeep(vl);
      return newVL;
    },
  },
  REMOVE_STACK: {
    token: 'REMOVE_STACK',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (param1 && newEncoding && newEncoding[param1]) {
        delete newEncoding[param1]['stack'];
      }
      return newVL;
    },
  },
  ADD_CHANNEL: {
    token: 'ADD_CHANNEL',
    type: 'startswith',
    executor: ({ vl, action, fields }) => {
      // hard(no_encodings) :- not encoding(_).
      // hard(point_tick_bar_without_x_or_y) :- mark(point;tick;bar), not channel(_,x), not channel(_,y).
      // hard(line_area_without_x_y) :- mark(line;area), not channel(_,(x;y)).
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (!fields || (newEncoding && newEncoding[param1])) return newVL;
      // prefer to add quantitative?
      const useF = fields.find((field) => field.fieldType === 'number') || fields[0];
      newEncoding[param1 || 'x'] = {
        field: useF.field,
        type: useF.type,
        aggregate: 'mean',
      };
      return newVL;
    },
  },
  REMOVE_CHANNEL: {
    token: 'REMOVE_CHANNEL',
    type: 'startswith',
    executor: ({ vl, action, ruleID }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (param1) {
        if (ruleID === 'repeat_channel') {
          // repeat了channel 删除带有dupl标签的
          (Object.keys(newEncoding) as Channel[]).forEach((channel) => {
            if (channel.includes(`${param1}_dupl_`)) {
              delete newEncoding[channel];
            }
          });
        } else {
          delete newEncoding[param1];
        }
      }
      return newVL;
    },
  },
  ADD_FIELD: {
    token: 'ADD_FIELD',
    type: 'startswith',
    executor: ({ vl, action, fields }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      // hard(encoding_no_field_and_not_count,C) :- not field(E,_), not aggregate(E,count), encoding(E), channel(E, C).
      if (!fields) return newVL;
      // prefer to add quantitative?
      const useF = fields.find((field) => field.fieldType === 'number') || fields[0];
      newEncoding[param1]['field'] = useF.field;
      newEncoding[param1]['type'] = useF.type;
      return newVL;
    },
  },
  REMOVE_FIELD: {
    token: 'REMOVE_FIELD',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (param1) {
        delete newEncoding[param1]['field'];
      }
      return newVL;
    },
  },
  CHANGE_FIELD: {
    token: 'CHANGE_FIELD',
    type: 'startswith',
    executor: ({ vl, action, ruleID, fields }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      const encoding = vl.encoding as any;

      // 这里原来第二个条件没有取非
      if (!fields || !(newEncoding && newEncoding[param1]) || !encoding) return newVL;
      const usedFields: string[] = [];
      (Object.keys(encoding) as Channel[]).forEach((channel) => {
        if (encoding[channel] && encoding[channel]['field']) {
          usedFields.push(encoding[channel]['field']);
        }
      });

      switch (ruleID) {
        case 'bin_q_o':
        case 'log_q':
        case 'zero_q':
        case 'log_discrete':
        case 'line_area_with_discrete':
        case 'bar_tick_area_line_without_continuous_x_y':
          if (newEncoding[param1]) {
            const qField = fields.find((field) => field.fieldType === 'number' && !usedFields.includes(field.field));
            if (qField) {
              newEncoding[param1]['field'] = qField.field;
              newEncoding[param1]['type'] = qField.type;
            }
          }
          break;

        case 'stack_discrete':
          if (newEncoding[param1]['type'] !== 'quantitative') {
            // change field to continuous
            const qField = fields.find((field) => field.fieldType === 'number' && !usedFields.includes(field.field));
            if (qField) {
              newEncoding[param1]['field'] = qField.field;
              newEncoding[param1]['type'] = qField.type;
            }
          }
          break;

        case 'same_field_x_and_y': {
          const sField = fields.find((field) => {
            // 这里比较的应该是type(quantitative之类的)，而不是fieldType(string,number之类的)
            return field.type === newEncoding[param1]['type'] && !usedFields.includes(field.field);
          });
          if (sField) {
            newEncoding[param1]['field'] = sField.field;
            newEncoding[param1]['type'] = sField.type;
          }
          break;
        }
        case 'bar_tick_continuous_x_y': {
          // 找 ordinal nominal field
          const onField = fields.find(
            (field) => ['ordinal', 'nominal'].includes(field.type) && !usedFields.includes(field.field)
          );
          if (onField) {
            newEncoding[param1]['field'] = onField.field;
            newEncoding[param1]['type'] = onField.type;
          }
          break;
        }
        default:
          break;
      }
      return newVL;
    },
  },
  CHANGE_TYPE: {
    token: 'CHANGE_TYPE',
    type: 'startswith',
    executor: ({ vl, action, fields }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      const encoding = vl.encoding as any;
      if (!fields) return newVL;
      if (encoding[param1]['aggregate'] && encoding[param1]['aggregate'] === 'count') {
        newEncoding[param1]['type'] = 'quantitative';
      } else {
        const currField = encoding[param1]['field'];
        const correctField = fields.find((field) => {
          return field.field === currField;
        });
        if (correctField) {
          newEncoding[param1]['type'] = correctField['type'];
        }
      }
      return newVL;
    },
  },
  CORRECT_MARK: {
    token: 'CORRECT_MARK',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const maxMark = pickMostSimilar(AVAILABLE_MARKS.slice(), param1);
      newVL.mark = maxMark as AnyMark;
      return newVL;
    },
  },
  CORRECT_CHANNEL: {
    token: 'CORRECT_CHANNEL',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      const maxChannel = pickMostSimilar(AVAILABLE_CHANNELS.slice(), param1);
      renameKey(newEncoding, param1, maxChannel);
      return newVL;
    },
  },
  CORRECT_TYPE: {
    token: 'CORRECT_TYPE',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const param2 = action.param2.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      const maxPType = pickMostSimilar(AVAILABLE_P_TYPE.slice(), param2);
      newEncoding[param1]['type'] = maxPType;
      return newVL;
    },
  },
  CORRECT_AGGREGATE: {
    token: 'CORRECT_AGGREGATE',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const param2 = action.param2.toLowerCase();
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      const maxAgg = pickMostSimilar(AVAILABLE_AGG.slice(), param2);
      newEncoding[param1]['aggregate'] = maxAgg;
      return newVL;
    },
  },
  CORRECT_BIN: {
    token: 'CORRECT_BIN',
    type: 'startswith',
    executor: ({ vl, action }) => {
      const param1 = action.param1.toLowerCase();
      const param2 = Number(action.param2); // nubmer here
      const newVL = cloneDeep(vl);
      const newEncoding = newVL.encoding as any;
      if (param2 < 0) {
        newEncoding[param1]['bin']['maxbins'] = -param2;
      } else {
        newEncoding[param1]['bin']['maxbins'] = 10;
      }
      return newVL;
    },
  },
};
