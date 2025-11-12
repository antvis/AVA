module.exports = {
  setupFiles: ['<rootDir>/jest.setup.js'],
  collectCoverage: false,
  maxWorkers: 1, // 重要，保证所有评测用例在单独的进程中运行，避免并发调用模型请求
  testRegex: '(/__tests__/evaluation/.*.(test|spec)).(js?|jsx?|tsx?|ts?)$',
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
