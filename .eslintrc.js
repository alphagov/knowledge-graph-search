module.exports = {
  env: {
    browser: true,
    es2021: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'standard',
    'prettier',
    'plugin:jest/recommended',
    'plugin:cypress/recommended',
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint', 'cypress', 'jest'],
  rules: {
    // Add custom rules here
    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': 'error',
    'no-callback-literal': 'off',
    '@typescript-eslint/no-namespace': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    'jest/expect-expect': [
      'error',
      {
        assertFunctionNames: ['expect', 'request'],
      },
    ],
    '@typescript-eslint/no-var-requires': 'off',
  },
  overrides: [
    // Exclude the 'jest' plugin for .cy.ts files
    // Otherwise the jest plugin will complain on Cypress test files
    {
      files: ['**/*.cy.ts'],
      plugins: ['cypress'],
      rules: {
        'jest/valid-expect': 'off',
        'jest/expect-expect': 'off',
        'jest/no-commented-out-tests': 'off',
      },
    },
  ],
}
