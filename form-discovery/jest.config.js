export default {
  testEnvironment: 'node',
  transform: {},
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  collectCoverageFrom: [
    '../scripts/**/*.js',
    '!../scripts/**/*.test.js',
    'utils/**/*.js',
    '!utils/**/*.test.js',
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
    '**/__tests__/**/*.js',
    '**/?(*.)+(spec|test).js',
  ],
};
