module.exports = {
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  testRegex: '(/__tests__/.*.(test|spec)).(jsx?|tsx?|ts?)$',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverage: false,
  coveragePathIgnorePatterns: ['(tests/.*.mock).(jsx?|tsx?)$'],
  verbose: false,
  globals: {
    'ts-jest': {
      // 跳过 ts 报错
      diagnostics: false,
    },
  },
};
