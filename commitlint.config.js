module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['chore', 'ci', 'docs', 'feat', 'fix', 'refactor', 'revert', 'style', 'test']],
    'scope-empty': [2, 'never'],
    'scope-enum': [
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
      ],
    ],
  },
};
