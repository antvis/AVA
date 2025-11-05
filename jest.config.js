module.exports = {
  testRegex: '(/__tests__/.*.(test|spec)).(js?|jsx?|tsx?|ts?)$',
  collectCoverage: false,
  coveragePathIgnorePatterns: ['(tests/.*.mock).(jsx?|tsx?)$'],
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  transform: {
    '^.+\\.m?[tj]sx?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  moduleNameMapper: {
    '^@antv/ava': ['<rootDir>/src/index.ts'],
    '^@ava/(.*)$': '<rootDir>/src/$1',
    '^@antv/gpt-vis$': '<rootDir>/__tests__/__mocks__/gpt-vis.ts',
  },
};
