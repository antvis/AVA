module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['chore', 'ci', 'docs', 'feat', 'fix', 'refactor', 'revert', 'style', 'test']],
    'scope-empty': [2, 'never'],
    'custom-scope-enum': [
      2,
      'always',
      [
        'global',
        'ava',
        'ava/advisor',
        'ava/ckb',
        'ava/data',
        'ava/insight',
        'ava/ntv',
        'ava-react',
        'ava-react/ntv',
        'ava-react/insight-card',
        'ava-react/aug-input',
      ],
    ],
  },
  plugins: [
    {
      rules: {
        /**
         * We need use '/' as the module separator
         * However, commitlint use '/' for multiple scopes https://github.com/conventional-changelog/commitlint/blob/master/docs/concepts-commit-conventions.md#multiple-scopes
         * So we add a plugin modified from https://github.com/conventional-changelog/commitlint/blob/master/%40commitlint/rules/src/scope-enum.ts
         */
        'custom-scope-enum': (parsed, when = 'always', value = []) => {
          if (!parsed.scope) {
            return [true, ''];
          }

          // only use comma sign as separator
          const delimiters = ',';
          const scopeSegments = parsed.scope.split(delimiters);

          const check = (value, enums) => {
            if (value === undefined) {
              return false;
            }
            if (!Array.isArray(enums)) {
              return false;
            }
            return enums.indexOf(value) > -1;
          };

          const negated = when === 'never';
          const result = value.length === 0 || scopeSegments.every((scope) => check(scope, value));

          return [negated ? !result : result, `scope must ${negated ? 'not' : null} be one of [${value.join(', ')}]`];
        },
      },
    },
  ],
};
