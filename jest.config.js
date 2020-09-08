module.exports = {
  preset: 'ts-jest',
  globals: {
    'ts-jest': {
      diagnostics: false,
    },
  },
  browser: false,
  testPathIgnorePatterns: ['/node_modules/'],
  collectCoverage: false,
  collectCoverageFrom: ['packages/**/src/**/*.ts'],

  // adaptor jest config self
  testPathIgnorePatterns: ['<rootDir>/packages/adaptor'],
};
