import { ACTIONS } from './actions/actions';

export const RULE_IDS = [
  'enc_type_valid_1',
  'enc_type_valid_2',
  'bin_q_o',
  'log_q',
  'zero_q',
  'log_discrete',
  'log_zero',
  'log_non_positive',
  'bin_and_aggregate',
  'aggregate_o_valid',
  'aggregate_t_valid',
  'aggregate_nominal',
  'count_q_without_field_1',
  'count_q_without_field_2',
  'size_nominal',
  'size_negative',
  'repeat_channel',
  'no_encodings',
  'encoding_no_field_and_not_count',
  'point_tick_bar_without_x_or_y',
  'line_area_without_x_y',
  'line_area_with_discrete',
  'bar_tick_continuous_x_y',
  'bar_tick_area_line_without_continuous_x_y',
  'bar_area_without_zero_1',
  'bar_area_without_zero_2',
  'size_without_point_text',
  'same_field_x_and_y',
  'count_on_x_and_y',
  'aggregate_not_all_continuous',
  'count_twice',
  'bar_area_overlap',
  'stack_without_bar_area',
  'stack_without_summative_agg',
  'stack_without_discrete_color_1',
  'stack_without_discrete_color_2',
  'stack_without_discrete_color_3',
  'stack_discrete',
  'stack_without_x_y',
  'stack_with_non_positional_non_agg',
  'color_with_cardinality_gt_twenty',
  'invalid_mark',
  'invalid_channel',
  'invalid_type',
  'invalid_agg',
  'invalid_bin',
  'have_mark',
] as const;

export type RuleID = typeof RULE_IDS[number];

export function isRuleID(id: string): id is RuleID {
  return RULE_IDS.includes(id as any);
}

export const RULES: Record<RuleID, { source: string; actions: string[] }> = {
  enc_type_valid_1: {
    source:
      'hard(enc_type_valid_1,C,F) :- type(E,quantitative), field(E,F), fieldtype(F,(string;boolean)), channel(E, C).',
    actions: [ACTIONS.CHANGE_TYPE],
  },
  enc_type_valid_2: {
    source: 'hard(enc_type_valid_2,C,F) :- type(E,temporal), field(E,F), not fieldtype(F,datetime), channel(E, C).',
    actions: [ACTIONS.CHANGE_TYPE],
  },
  bin_q_o: {
    source: 'hard(bin_q_o,C,T) :- type(E,T), bin(E,_), T != quantitative, T != ordinal, channel(E, C).',
    actions: [ACTIONS.REMOVE_BIN, ACTIONS.CHANGE_FIELD],
  },
  log_q: {
    source: 'hard(log_q,C) :- log(E), not type(E,quantitative), channel(E, C).',
    actions: [ACTIONS.REMOVE_LOG, ACTIONS.CHANGE_FIELD],
  },
  zero_q: {
    source: 'hard(zero_q,C) :- zero(E), not type(E,quantitative), channel(E, C).',
    actions: [ACTIONS.REMOVE_ZERO, ACTIONS.CHANGE_FIELD],
  },
  log_discrete: {
    source: 'hard(log_discrete,C) :- log(E), discrete(E), channel(E, C).',
    actions: [ACTIONS.REMOVE_LOG, ACTIONS.REMOVE_BIN, ACTIONS.CHANGE_FIELD],
  },
  log_zero: {
    source: 'hard(log_zero,C) :- log(E), zero(E), channel(E, C).',
    actions: [ACTIONS.REMOVE_LOG, ACTIONS.REMOVE_ZERO],
  },
  log_non_positive: {
    source: 'hard(log_non_positive,C) :- log(E), field(E,F), extent(F,MIN,_), MIN <= 0, channel(E, C).',
    actions: [ACTIONS.REMOVE_LOG],
  },
  bin_and_aggregate: {
    source: 'hard(bin_and_aggregate,C) :- bin(E,_), aggregate(E,_), channel(E, C).',
    actions: [ACTIONS.REMOVE_BIN, ACTIONS.REMOVE_AGGREGATE],
  },
  aggregate_o_valid: {
    source:
      'hard(aggregate_o_valid,C,A) :- type(E,ordinal), aggregate(E,A), A != min, A != max, A != median, channel(E, C).',
    actions: [ACTIONS.CHANGE_AGGREGATE],
  },
  aggregate_t_valid: {
    source: 'hard(aggregate_t_valid,C,A) :- type(E,temporal), aggregate(E,A), A != min, A != max, channel(E, C).',
    actions: [ACTIONS.CHANGE_AGGREGATE],
  },
  aggregate_nominal: {
    source: 'hard(aggregate_nominal,C) :- aggregate(E,_), type(E,nominal), channel(E, C).',
    actions: [ACTIONS.REMOVE_AGGREGATE],
  },
  count_q_without_field_1: {
    source: 'hard(count_q_without_field_1,C) :- aggregate(E,count), field(E,_), channel(E, C).',
    actions: [ACTIONS.REMOVE_FIELD, ACTIONS.REMOVE_COUNT],
  },
  count_q_without_field_2: {
    source: 'hard(count_q_without_field_2,C) :- aggregate(E,count), not type(E,quantitative), channel(E, C).',
    actions: [ACTIONS.CHANGE_TYPE],
  },
  size_nominal: {
    source: 'hard(size_nominal,C) :- channel(E,size), type(E,nominal), channel(E, C).',
    actions: [ACTIONS.REMOVE_CHANNEL, ACTIONS.MOVE_CHANNEL],
  },
  size_negative: {
    source: 'hard(size_negative,C) :- channel(E,size), enc_extent(E,MIN,MAX), MIN < 0, MAX > 0, channel(E, C).',
    actions: [ACTIONS.REMOVE_CHANNEL, ACTIONS.MOVE_CHANNEL],
  },
  repeat_channel: {
    source: 'hard(repeat_channel,C):- single_channel(C), 2 { channel(_,C) }.',
    actions: [ACTIONS.REMOVE_CHANNEL, ACTIONS.MOVE_CHANNEL],
  },
  no_encodings: {
    source: 'hard(no_encodings) :- not encoding(_).',
    actions: [ACTIONS.ADD_CHANNEL],
  },
  encoding_no_field_and_not_count: {
    source:
      'hard(encoding_no_field_and_not_count,C) :- not field(E,_), not aggregate(E,count), encoding(E), channel(E, C).',
    actions: [ACTIONS.ADD_FIELD, ACTIONS.ADD_COUNT],
  },
  point_tick_bar_without_x_or_y: {
    source: 'hard(point_tick_bar_without_x_or_y) :- mark(point;tick;bar), not channel(_,x), not channel(_,y).',
    actions: [ACTIONS.ADD_CHANNEL_X, ACTIONS.ADD_CHANNEL_Y],
  },
  line_area_without_x_y: {
    source: 'hard(line_area_without_x_y) :- mark(line;area), not channel(_,(x;y)).',
    actions: [ACTIONS.ADD_CHANNEL_X, ACTIONS.ADD_CHANNEL_Y],
  },
  line_area_with_discrete: {
    source: 'hard(line_area_with_discrete) :- mark(line;area), channel_discrete(x), channel_discrete(y).',
    actions: [
      ACTIONS.CHANGE_MARK,
      ACTIONS.CHANGE_FIELD_X,
      ACTIONS.ADD_COUNT_X,
      ACTIONS.REMOVE_BIN_X,
      ACTIONS.CHANGE_FIELD_Y,
      ACTIONS.ADD_COUNT_Y,
      ACTIONS.REMOVE_BIN_Y,
    ],
  },
  bar_tick_continuous_x_y: {
    source: 'hard(bar_tick_continuous_x_y) :- mark(bar;tick), channel_continuous(x), channel_continuous(y).',
    actions: [ACTIONS.CHANGE_MARK, ACTIONS.CHANGE_FIELD_X, ACTIONS.BIN_X, ACTIONS.CHANGE_FIELD_Y, ACTIONS.BIN_Y],
  },
  bar_tick_area_line_without_continuous_x_y: {
    source:
      'hard(bar_tick_area_line_without_continuous_x_y) :- mark(bar;tick;area;line), not channel_continuous(x), not channel_continuous(y).',
    actions: [
      ACTIONS.CHANGE_MARK,
      ACTIONS.CHANGE_FIELD_X,
      ACTIONS.ADD_COUNT_X,
      ACTIONS.CHANGE_FIELD_Y,
      ACTIONS.ADD_COUNT_Y,
    ],
  },
  bar_area_without_zero_1: {
    source: 'hard(bar_area_without_zero_1, x) :- mark(bar;area), channel(E,x), orientation(horizontal), not zero(E).',
    actions: [ACTIONS.ZERO],
  },
  bar_area_without_zero_2: {
    source: 'hard(bar_area_without_zero_2, y) :- mark(bar;area), channel(E,y), orientation(vertical), not zero(E).',
    actions: [ACTIONS.ZERO],
  },
  size_without_point_text: {
    source: 'hard(size_without_point_text, size) :- channel(_,size), not mark(point), not mark(text).',
    actions: [ACTIONS.CHANGE_MARK, ACTIONS.REMOVE_CHANNEL],
  },
  same_field_x_and_y: {
    source: 'hard(same_field_x_and_y) :- { field(E,F) : channel(E,x); field(E,F) : channel(E,y) } >= 2, field(F).',
    actions: [ACTIONS.CHANGE_FIELD_X, ACTIONS.CHANGE_FIELD_Y],
  },
  count_on_x_and_y: {
    source: 'hard(count_on_x_and_y):- channel(EX,x), channel(EY,y), aggregate(EX,count), aggregate(EY,count).',
    actions: [ACTIONS.REMOVE_COUNT_X, ACTIONS.REMOVE_COUNT_Y],
  },
  aggregate_not_all_continuous: {
    source: 'hard(aggregate_not_all_continuous, C):- aggregate(_,_), continuous(E), not aggregate(E,_), channel(E, C).',
    actions: [ACTIONS.AGGREGATE],
  },
  count_twice: {
    source: 'hard(count_twice, C) :- aggregate(E1, count), aggregate(E2, count), channel(E1, C).',
    actions: [ACTIONS.REMOVE_COUNT],
  },
  bar_area_overlap: {
    source: 'hard(bar_area_overlap) :- mark(bar;area), overlap.',
    actions: [ACTIONS.CHANGE_MARK, ACTIONS.AGGREGATE, ACTIONS.STACK],
  },
  stack_without_bar_area: {
    source: 'hard(stack_without_bar_area, C) :- stack(E, _), not mark(bar), not mark(area), channel(E, C).',
    actions: [ACTIONS.REMOVE_STACK, ACTIONS.CHANGE_MARK],
  },
  stack_without_summative_agg: {
    source:
      'hard(stack_without_summative_agg,C,A) :- stack(E,_), aggregate(E,A), not summative_aggregate_op(A), channel(E, C).',
    actions: [ACTIONS.REMOVE_STACK, ACTIONS.CHANGE_AGGREGATE],
  },
  stack_without_discrete_color_1: {
    source:
      'hard(stack_without_discrete_color_or_detail, color) :- stack(_), not channel_discrete(color), not channel(_,detail).',
    actions: [ACTIONS.BIN, ACTIONS.REMOVE_STACK],
  },
  stack_without_discrete_color_2: {
    source:
      'hard(stack_without_discrete_color_or_detail, color) :- stack(_), not channel_discrete(color), not channel(_,detail).',
    actions: [ACTIONS.ADD_CHANNEL_COLOR, ACTIONS.REMOVE_STACK],
  },
  stack_without_discrete_color_3: {
    source:
      'hard(stack_without_discrete_color_or_detail, color) :- stack(_), not channel_discrete(color), not channel(_,detail).',
    actions: [ACTIONS.REMOVE_STACK, ACTIONS.CHANGE_FIELD, ACTIONS.BIN],
  },
  stack_discrete: {
    source: 'hard(stack_discrete,C) :- stack(E,_), discrete(E), channel(E, C).',
    actions: [ACTIONS.REMOVE_STACK, ACTIONS.REMOVE_BIN, ACTIONS.CHANGE_FIELD],
  },
  stack_without_x_y: {
    source: 'hard(stack_without_x_y,C) :- stack(E,_), not channel(E,x), not channel(E,y), channel(E, C).',
    actions: [ACTIONS.REMOVE_STACK, ACTIONS.MOVE_CHANNEL],
  },
  stack_with_non_positional_non_agg: {
    source:
      'hard(stack_with_non_positional_non_agg,C) :- stack(_), non_positional(C), channel(E,C), not aggregate(E,_), continuous(E).',
    actions: [ACTIONS.REMOVE_STACK, ACTIONS.AGGREGATE, ACTIONS.MOVE_CHANNEL],
  },
  color_with_cardinality_gt_twenty: {
    source: 'hard(color_with_cardinality_gt_twenty,C) :- channel(E,color), discrete(E), enc_cardinality(E,C), C > 20.',
    actions: [ACTIONS.MOVE_CHANNEL],
  },
  invalid_mark: {
    source: 'hard(invalid_mark,M) :- mark(M), not marktype(M).',
    actions: [ACTIONS.CORRECT_MARK],
  },
  invalid_channel: {
    source: 'hard(invalid_channel,C) :- channel(_,C), not channel(C).',
    actions: [ACTIONS.CORRECT_CHANNEL],
  },
  invalid_type: {
    source: 'hard(invalid_type,T) :- type(_,T), not type(T).',
    actions: [ACTIONS.CORRECT_TYPE],
  },
  invalid_agg: {
    source: 'hard(invalid_agg,A) :- aggregate(_,A), not aggregate_op(A).',
    actions: [ACTIONS.CORRECT_AGGREGATE],
  },
  invalid_bin: {
    source: 'hard(invalid_bin,B) :- bin(_,B), not B >= 0.',
    actions: [ACTIONS.CORRECT_BIN],
  },
  have_mark: {
    source: 'hard(have_mark) :- not mark(_).',
    actions: [ACTIONS.ADD_MARK],
  },
};
