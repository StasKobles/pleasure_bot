module.exports = {
  env: {
    es2021: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier', // Включи это, если используешь Prettier
  ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: [
    '@typescript-eslint',
    'prettier', // Включи это, если используешь Prettier
    'unused-imports',
  ],
  rules: {
    // Здесь ты можешь добавить свои правила или переопределить существующие
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    'prettier/prettier': 'error', // Включи это, если используешь Prettier
    'unused-imports/no-unused-imports': 'error',
    'unused-imports/no-unused-vars': [
      'warn',
      {
        vars: 'all',
        varsIgnorePattern: '^_',
        args: 'after-used',
        argsIgnorePattern: '^_',
      },
    ],
  },
};
