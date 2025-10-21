module.exports = {
  env: {
    browser: true,
    node: true,
    jest: true,
  },
  ignorePatterns: ['*.test.ts'],
  extends: [
    'eslint:recommended',
    'airbnb-base',
    'plugin:react/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'prettier',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['@typescript-eslint', 'import', 'react'],
  rules: {
    semi: 2,
    quotes: [1, 'single', 'avoid-escape'],
    'no-unused-vars': 0,
    'no-plusplus': 0,
    '@typescript-eslint/no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    'no-underscore-dangle':0,
    'import/extensions': 0,
    'import/prefer-default-export': 0,
    'object-curly-newline': 0,
    'class-methods-use-this': 0,
    'max-classes-per-file': 0,
    'no-shadow': 0,
    'no-console': 2,
    'arrow-body-style': 0,
    'no-useless-constructor': 0,
    'no-sparse-arrays': 0,
    'no-inner-declarations': 0,
    'no-use-before-define': 0,
    // Allow for..of, keep other Airbnb restrictions
    'no-restricted-syntax': [
      1,
      {
        selector: 'ForInStatement',
        message: 'for..in is discouraged. Use Object.keys/entries instead.',
      },
      {
        selector: 'LabeledStatement',
        message: 'Labels are discouraged and can make code confusing.',
      },
      {
        selector: 'WithStatement',
        message: 'with is disallowed in strict mode and obscures scope.',
      },
    ],
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
    'no-await-in-loop': 0,
    'import/order': [
      2,
      {
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type', 'unknown'],
        pathGroups: [
          {
            pattern: 'react',
            group: 'external',
            position: 'before',
          },
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '*.{less,css}',
            patternOptions: { matchBase: true },
            group: 'unknown',
            position: 'after',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin', 'type'],
        warnOnUnassignedImports: true,
        'newlines-between': 'always',
      },
    ],
    'no-param-reassign': 1,
    'no-continue': 1,
    'no-bitwise': 1,
  },
  settings: {
    react: {
      version: 'detect',
    },
    'import/parsers': {
      '@typescript-eslint/parser': ['.ts', '.tsx'],
    },
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./packages/ava/tsconfig.json']
      },
    },
  },
};
