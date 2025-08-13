// https://eslint.org/docs/user-guide/configuring
// File taken from https://github.com/vuejs-templates/webpack/blob/1.3.1/template/.eslintrc.js, thanks.

module.exports = {
  root: true,
  env: {
    browser: true,
    webextensions: true,
    node: true,
  },
  ignorePatterns: ['src/lib/google-*', 'dist', 'build', 'node_modules'],

  overrides: [
    // JS + Vue
    {
      files: ['**/*.{js,vue}'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@babel/eslint-parser',
        requireConfigFile: false,
        ecmaVersion: 2022,
        sourceType: 'module',
      },
      extends: [
        'plugin:vue/vue3-recommended',
        'airbnb-base',
        'plugin:prettier/recommended',
      ],
    },

    // TS + Vue(with TS)
    {
      files: ['**/*.{ts,tsx}', '**/*.vue'],
      parser: 'vue-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        ecmaVersion: 2022,
        sourceType: 'module',
        project: ['./tsconfig.json'],
      },
      extends: [
        'plugin:vue/vue3-recommended',
        'plugin:@typescript-eslint/recommended',
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:prettier/recommended',
      ],
      plugins: ['@typescript-eslint'],
    },
  ],

  plugins: ['vue'],

  settings: {
    'import/resolver': {
      vite: { configPath: './vite.config.ts' },
      alias: {
        map: [
          ['@', './src'],
          ['secrets', './secrets.blank.js'],
          ['@business', './business/dev'],
        ],
        extensions: ['.js', '.ts', '.vue', '.json'],
      },
    },
  },

  globals: {
    BROWSER_TYPE: true,
    __SECRETS__: 'readonly',
  },

  rules: {
    camelcase: 'off',
    'no-await-in-loop': 'off',
    'no-alert': 'off',
    'import/no-import-module-exports': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'no-underscore-dangle': 'off',
    'func-names': 'off',
    'vue/v-on-event-hyphenation': 'off',
    'import/no-named-default': 'off',
    'no-restricted-syntax': 'off',
    'vue/multi-word-component-names': 'off',
    'no-param-reassign': 'off',
    'import/no-extraneous-dependencies': 'off',
    'import/prefer-default-export': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',

    'import/extensions': [
      'error',
      'ignorePackages',
      { js: 'never', ts: 'never', vue: 'always' },
    ],

    // TS rules
    '@typescript-eslint/no-unused-vars': ['warn'],
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',

    // Prettier
    'prettier/prettier': ['error', { endOfLine: 'auto' }],
  },
};
