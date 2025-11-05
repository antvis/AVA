module.exports = {
  testRegex: '(/__tests__/.*.(test|spec)).(js?|jsx?|tsx?|ts?)$',
  collectCoverage: false,
  coveragePathIgnorePatterns: ['(tests/.*.mock).(jsx?|tsx?)$'],
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
  },
};
