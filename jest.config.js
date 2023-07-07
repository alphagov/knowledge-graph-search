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
  setupFiles: ['<rootDir>/jest.setup.ts'],
  coverageThreshold: {
    global: 70,
  },
}
