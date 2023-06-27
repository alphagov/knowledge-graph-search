/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/*.test.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleFileExtensions: ['js', 'ts', 'json', 'node'],
  collectCoverage: true,
  collectCoverageFrom: ['./src/backend/**/*.ts', './src/utils/*.ts'],
  /* uncomment when we want to enforce these thresholds
  coverageThreshold: {
  "global": {
    "branches": 95,
    "functions": 95,
    "lines": 95,
    "statements": 95
    }
  },*/
}
