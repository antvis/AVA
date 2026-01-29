module.exports = {
  env: {
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'import'],
  rules: {
    semi: 2,
    quotes: [1, 'single', 'avoid-escape'],
    'no-unused-vars': 0,
    '@typescript-eslint/no-unused-vars': 2,
    'import/extensions': 0,
    'import/prefer-default-export': 0,
    'object-curly-newline': 0,
    'class-methods-use-this': 0,
    'no-shadow': 0,
    'no-console': 2,
    'arrow-body-style': 0,
    'no-useless-constructor': 0,
    'no-sparse-arrays': 0,
    'no-inner-declarations': 0,
    'no-use-before-define': 0,
    '@typescript-eslint/no-use-before-define': 2,
    '@typescript-eslint/indent': 0,
    'no-constant-condition': 0,
    '@typescript-eslint/explicit-function-return-type': 0,
    '@typescript-eslint/no-empty-function': 0,
    '@typescript-eslint/explicit-member-accessibility': [2, { accessibility: 'no-public' }],
    '@typescript-eslint/no-non-null-assertion': 0,
    '@typescript-eslint/no-namespace': 0,
    '@typescript-eslint/ban-ts-ignore': 0,
    '@typescript-eslint/no-empty-interface': 1,
    '@typescript-eslint/camelcase': 0,
    '@typescript-eslint/no-explicit-any': 0,
    '@typescript-eslint/type-annotation-spacing': 0,
    'import/order': [
      2,
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type', 'unknown'],
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin', 'type'],
        warnOnUnassignedImports: true,
        'newlines-between': 'always',
      },
    ],
  },
  settings: {
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
      },
    },
  },
};
