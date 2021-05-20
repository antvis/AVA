% ====== Soft Rules ======

% === Within Encodings ===

% @constraint Bar mark cannot have min domain.
soft(bar_without_domain_min,x) :- mark(bar), channel(E,x), orientation(horizontal), domain_min(E).
soft(bar_without_domain_min_column,y) :- mark(bar), channel(E,y), orientation(vertical), domain_min(E).