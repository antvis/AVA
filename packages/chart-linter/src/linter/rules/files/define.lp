% ====== Definitions ======

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