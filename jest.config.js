export default {
  testEnvironment: 'node',
  transform: {},
  moduleNameMapper: {
    '^wix-data$': '<rootDir>/__mocks__/wix-data.js',
    '^wix-web-module$': '<rootDir>/__mocks__/wix-web-module.js',
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  modulePaths: [
    '<rootDir>/form-discovery/node_modules',
  ],
  collectCoverageFrom: [
    'scripts/**/*.js',
    '!scripts/**/*.test.js',
    '!scripts/setup-credentials.js', // CLI entry point - tested manually
  ],
  coverageThreshold: {
    global: {
      branches: 90,
      functions: 95,
      lines: 95,
      statements: 95,
    },
  },
  testMatch: [
    '**/scripts/**/*.test.js',
  ],
};
