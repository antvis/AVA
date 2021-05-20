// GENERATED WITH concat_lp.sh. DO NOT MODIFY.

export const DEFINE = `% ====== Definitions ======

% Types of marks to encode data.
marktype(point;bar;line;area;text;tick;rect).
% High level data types: quantitative, ordinal, nominal, temporal.
type(quantitative;ordinal;nominal;temporal).
% Basic types of the data.
primitive_type(string;number;boolean;datetime).
% Supported aggregation functions.
aggregate_op(count;mean;median;min;max;stdev;sum).
summative_aggregate_op(count;sum).
% Numbers of bins that can be recommended; any natural number is allowed.
binning(10;25;200).

% Encoding channels.
single_channel(x;y;color;size;shape;text;row;column).
multi_channel(detail).
channel(C) :- single_channel(C).
channel(C) :- multi_channel(C).
non_positional(color;size;shape;text;detail).

% Possible tasks.
tasks(value;summary).

% Possible stackings.
stacking(zero;normalize).

% ====== Helpers ======

discrete(E) :- type(E,(nominal;ordinal)).
discrete(E) :- bin(E,_).
% check fieldtype for discrete
discrete(E) :- fieldtype(F,string), field(E,F).
continuous(E) :- encoding(E), not discrete(E).

channel_discrete(C) :- discrete(E), channel(E,C).
channel_continuous(C) :- continuous(E), channel(E,C).

ordered(E) :- type(E,(ordinal;quantitative)).

% Fields
field(F) :- fieldtype(F,_).

% Stacking is applied to the continuous x or y.
stack(EC,S) :- channel(EC,(x;y)), channel(ED,(x;y)), continuous(EC), discrete(ED), stack(S).
% X and y are continuous.
stack(E,S) :- channel_continuous(x), channel(E,y), continuous(E), stack(S).

stack(S) :- stack(_,S).

% Data properties
enc_cardinality(E,C) :- field(E,F), cardinality(F,C).
enc_entropy(E,EN) :- field(E,F), entropy(F,EN).
enc_interesting(E) :- field(E,F), interesting(F).
enc_extent(E,MIN,MAX) :- field(E,F), extent(F,MIN,MAX).

% Cardinality of discrete field. A binned field has the cadinality of its field.
discrete_cardinality(E,CE) :- discrete(E), enc_cardinality(E,CE), channel(E,C), not bin(E,_).
discrete_cardinality(E,CB) :- channel(E,C), bin(E,CB).

% Define a fake soft/2 for all soft/1.
soft(F,_placeholder) :- soft(F).

% Silence warnings about properties never appearing in head.
entropy(0,0) :- #false.
interesting(0) :- #false.
extent(0,0,0) :- #false.
soft(0) :- #false.
task(value) :- #false.
task(summary) :- #false.
data(0) :- #false.
domain_min(0) :- #false.

% == Chart Types ==

% Continuous by continuous.
is_c_c :- channel_continuous(x), channel_continuous(y).

% Continuous by discrete (or continuous only).
is_c_d :- channel_continuous(x), not channel_continuous(y).
is_c_d :- channel_continuous(y), not channel_continuous(x).

% Discrete by discrete.
is_d_d :- channel_discrete(x), channel_discrete(y).

% == Overlap ==

% The continuous variable is a measure (it is aggregated) and all other channels are .aggregated, or we use stack -> no overlap
non_pos_unaggregated :- channel(E,C), non_positional(C), not aggregate(E,_).
no_overlap :- is_c_d, continuous(E), channel(E,(x;y)), aggregate(E,_), not non_pos_unaggregated.
no_overlap :- is_c_d, stack(_).

% the size of the discrete positional encoding
discrete_size(S) :- is_c_d, x_y_cardinality(_,S).
discrete_size(1) :- is_c_d, channel_continuous(x), not channel(_,y).
discrete_size(1) :- is_c_d, channel_continuous(y), not channel(_,x).

% Data size is as small as discrete dimension -> no overlap.
no_overlap :- is_c_d, num_rows(S), discrete_size(S).

% We        definitely overlap if the data size > discrete size.
overlap :- is_c_d, not no_overlap, num_rows(S1), discrete_size(S2), S1 > S2.

% helpers to go from quadratic to linear number of grounding
x_y_cardinality(x,S) :- channel(E,x), discrete_cardinality(E,S).
x_y_cardinality(y,S) :- channel(E,y), discrete_cardinality(E,S).

% No overlap if all other dimensions are aggregated.
discrete_size(S) :- is_d_d, x_y_cardinality(x,SX), x_y_cardinality(y,SY), S = SX*SY.
no_overlap :- is_d_d, not non_pos_unaggregated.
no_overlap :- is_d_d, num_rows(S1), discrete_size(S2), S1 <= S2.  % This cannot guarantee no overlap.

% We can guarantee overlap using this rule unless we are using row / column.
row_col :- channel(_,(row;column)).
overlap :- is_d_d, channel(E,C), not row_col, not no_overlap, num_rows(S1), discrete_size(S2), S1 > S2.

% == Orientation ==

% Orientation tells us which one is the dependent and independent variable.

orientation(vertical) :- mark(bar;tick;area;line), channel_discrete(x).
orientation(vertical) :- mark(area;line), channel_continuous(x), channel_continuous(y).

orientation(horizontal) :- mark(bar;tick;area;line), channel_discrete(y).

% avoid 'info: atom does not occur in any rule head' warning
#defined zero/1.
#defined aggregate/2.
#defined log/1.
#defined num_rows/1.
#defined cardinality/2.
#defined bin/2.
#defined fieldtype/2.
#defined type/2.
#defined encoding/1.
#defined channel/2.
#defined field/2.

`;

export const HARD = `% ====== Expressiveness and Well-Formedness Constraints ======

% === Within Encodings ===

% @constraint Primitive type has to support data type.
hard(enc_type_valid_1,C,F) :- type(E,quantitative), field(E,F), fieldtype(F,(string;boolean)), channel(E, C).
hard(enc_type_valid_2,C,F) :- type(E,temporal), field(E,F), not fieldtype(F,datetime), channel(E, C).

% @constraint Can only bin quantitative or ordinal.
hard(bin_q_o,C,T) :- type(E,T), bin(E,_), T != quantitative, T != ordinal, channel(E, C).

% @constraint Can only use log with quantitative.
% hard(log_q,C) :- log(E), not type(E,quantitative), channel(E, C).

% @constraint Can only use zero with quantitative.
hard(zero_q,C) :- zero(E), not type(E,quantitative), channel(E, C).

% @constraint Cannot use log scale with discrete (which includes binned).
hard(log_discrete,C) :- log(E), discrete(E), channel(E, C).

% @constraint Cannot use log and zero together.
hard(log_zero,C) :- log(E), zero(E), channel(E, C).

% @constraint Cannot use log if the data is negative or zero.
hard(log_non_positive,C) :- log(E), field(E,F), extent(F,MIN,_), MIN <= 0, channel(E, C).

% @constraint Cannot bin and aggregate.
hard(bin_and_aggregate,C) :- bin(E,_), aggregate(E,_), channel(E, C).

% @constraint Oridnal only supports min, max, and median.
hard(aggregate_o_valid,C,A) :- type(E,ordinal), aggregate(E,A), A != min, A != max, A != median, channel(E, C).

% @constraint Temporal only supports min and max.
hard(aggregate_t_valid,C,A) :- type(E,temporal), aggregate(E,A), A != min, A != max, channel(E, C).

% @constraint Cannot aggregate nominal.
hard(aggregate_nominal,C) :- aggregate(E,_), type(E,nominal), channel(E, C).

% @constraint Count has to be quantitative and not use a field.
hard(count_q_without_field_1,C) :- aggregate(E,count), field(E,_), channel(E, C).
hard(count_q_without_field_2,C) :- aggregate(E,count), not type(E,quantitative), channel(E, C).

% @constraint Size implies order so nominal is misleading.
% add E 
hard(size_nominal,C) :- channel(E,size), type(E,nominal), channel(E, C).

% @constraint Do not use size when data is negative as size implies that data is positive.
hard(size_negative,C) :- channel(E,size), enc_extent(E,MIN,MAX), MIN < 0, MAX > 0, channel(E, C).

% === Across encodings and between encodings and marks ===

% @constraint Cannot use single channels twice.
hard(repeat_channel,C):- single_channel(C), 2 { channel(_,C) }.

% @constraint There has to be at least one encoding. Otherwise, the visualization doesn't show anything.
hard(no_encodings) :- not encoding(_).

% @constraint All encodings (if they have a channel) require field except if we have a count aggregate.
hard(encoding_no_field_and_not_count,C) :- not field(E,_), not aggregate(E,count), encoding(E), channel(E, C).

% @constraint Point, tick, and bar require x or y channel.
hard(point_tick_bar_without_x_or_y) :- mark(point;tick;bar), not channel(_,x), not channel(_,y).

% @constraint Line and area require x and y channel.
hard(line_area_without_x_y) :- mark(line;area), not channel(_,(x;y)).

% @constraint Line and area cannot have two discrete.
% hard(line_area_with_discrete) :- mark(line;area), channel_discrete(x), channel_discrete(y).

% @constraint Bar and tick cannot have both x and y continuous.
hard(bar_tick_continuous_x_y) :- mark(bar;tick), channel_continuous(x), channel_continuous(y).

% @constraint Bar, tick, line, area require some continuous variable on x or y.
hard(bar_tick_area_line_without_continuous_x_y) :- mark(bar;tick;area;line), not channel_continuous(x), not channel_continuous(y).

% @constraint Bar and area mark requires scale of continuous to start at zero.
hard(bar_area_without_zero_1,x) :- mark(bar;area), channel(E,x), orientation(horizontal), not zero(E).
hard(bar_area_without_zero_2,y) :- mark(bar;area), channel(E,y), orientation(vertical), not zero(E).

% @constraint Size only works with some marks. Vega-Lite can also size lines, and ticks but that would violate best practices.
hard(size_without_point_text, size) :- channel(_,size), not mark(point), not mark(text).

% @constraint Don't use the same field on x and y.
hard(same_field_x_and_y) :- field(E1,F1), channel(E1,x); field(E2,F2), channel(E2,y), field(F1), field(F2), F1==F2, x!=y.
% hard(same_field_x_and_y) :- { field(E,F) : channel(E,x); field(E,F) : channel(E,y) } >= 2, field(F).

% @constraint Don't use count on x and y.
% hard(count_on_x_and_y):- channel(EX,x), channel(EY,y), aggregate(EX,count), aggregate(EY,count).

% @constraint If we use aggregation, then all continuous fields need to be aggeragted.
% hard(aggregate_not_all_continuous, C):- aggregate(_,_), continuous(E), not aggregate(E,_), channel(E, C).

% @constraint Don't use count twice.
% hard(count_twice) :- { aggregate(_,count) } = 2, channel(_, C).
hard(count_twice, C) :- aggregate(E1, count), aggregate(E2, count), channel(E1, C), E1 != E2.

% === Global properties ===

% @constraint Bars and area cannot overlap.
% hard(bar_area_overlap) :- mark(bar;area), overlap.

% == Stacking ==

% @constraint Only use stacking for bar and area.
hard(stack_without_bar_area, C) :- stack(E, _), not mark(bar), not mark(area), channel(E, C).

% @constraint Don't stack if aggregation is not summative (summative are count, sum, distinct, valid, missing).
hard(stack_without_summative_agg,C,A) :- stack(E,_), aggregate(E,A), not summative_aggregate_op(A), channel(E, C).

% @constraint Can only use stack if we also use discrete color, or detail.
% hard(stack_without_discrete_color_or_detail, color) :- stack(_), not channel_discrete(color), not channel(_,detail).
hard(stack_without_discrete_color_1,color) :- stack(_), not channel_discrete(color), channel(_,color).
hard(stack_without_discrete_color_2,C,color) :- stack(_), not channel(_,color), channel(_, C), C!=x, C!=y.
hard(stack_without_discrete_color_3,color) :- stack(_), 1 { channel(_,C) } 2, channel(_, (x;y)).

% @constraint Stack can only be on continuous.
hard(stack_discrete,C) :- stack(E,_), discrete(E), channel(E, C).

% @constraint Stack can only be on x or y.
hard(stack_without_x_y,C) :- stack(E,_), not channel(E,x), not channel(E,y), channel(E, C).

% @constraint Cannot use non positional continuous with stack unless it's aggregated.
hard(stack_with_non_positional_non_agg,C) :- stack(_), non_positional(C), channel(E,C), not aggregate(E,_), continuous(E).

% @constraint At most 20 categorical colors.
hard(color_with_cardinality_gt_twenty,C) :- channel(E,color), discrete(E), enc_cardinality(E,C), C > 20.

% === Type checks ===

% @constraint Check mark.
hard(invalid_mark,M) :- mark(M), not marktype(M).

% @constraint Check types of encoding properties.
hard(invalid_channel,C) :- channel(_,C), not channel(C).
hard(invalid_type,C,T) :- type(E,T), not type(T), channel(E, C).
hard(invalid_agg,C,A) :- aggregate(E,A), not aggregate_op(A), channel(E, C).
hard(invalid_bin,C,B) :- bin(E,B), not B >= 0, channel(E, C).  % @constraint Bin has to be a natural number.

% must have mark
% hard(have_mark) :- not mark(_).

`;

export const SOFT = `% ====== Soft Rules ======

% === Within Encodings ===

% @constraint Bar mark cannot have min domain.
soft(bar_without_domain_min,x) :- mark(bar), channel(E,x), orientation(horizontal), domain_min(E).
soft(bar_without_domain_min_column,y) :- mark(bar), channel(E,y), orientation(vertical), domain_min(E).

`;

export const OUTPUT = `#show hard/1.
#show hard/2.
#show hard/3.
#show soft/2.

`;
