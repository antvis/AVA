export const rulesDoc: any = {
  'enc-type-valid-quant': {
    id: 'enc-type-valid-quant',
    intro: 'Primitive type has to support data type',
    description: `'type' and 'field' in 'encoding' must match. For example, 'quantitative' can not be the 'type' of a string or boolean field.`,
    mode: 'hard',
    ref: {
      source: 'Draco',
      id: 'enc_type_valid',
    },
    ASP: `% @constraint Primitive type has to support data type.
    hard(enc_type_valid_1,E,F) :- type(E,quantitative), field(E,F), fieldtype(F,(string;boolean)).`,
    examples: [
      {
        bad: `{...some..spec}`,
        good: `{...some..spec}`,
      },
    ],
  },
  'enc-type-valid-date': {},
};
