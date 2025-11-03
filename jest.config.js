module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testRegex: '(/__tests__/.*.(test|spec)).(js?|jsx?|tsx?|ts?)$',
  collectCoverage: false,
  coveragePathIgnorePatterns: ['(tests/.*.mock).(jsx?|tsx?)$'],
  verbose: false,
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
};
