const path = require('path');

module.exports = {
  root: true,
  overrides: [
    {
      files: ['**/*.ts'],
      parserOptions: { project: path.resolve(__dirname, 'tsconfig.eslint.json') },
    },
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint/eslint-plugin', 'prettier', 'simple-import-sort', 'unused-imports'],
  extends: [
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  env: {
    browser: true,
    node: true,
  },
  rules: {
    '@typescript-eslint/interface-name-prefix': 'off',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'sort-imports': 'off',
    'import/order': 'off',
    'simple-import-sort/imports': 'error',
    'simple-import-sort/exports': 'error',
    'unused-imports/no-unused-imports-ts': 'error',
    'prettier/prettier': 'error',
  },
};
