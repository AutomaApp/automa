// https://eslint.org/docs/user-guide/configuring
// File taken from https://github.com/vuejs-templates/webpack/blob/1.3.1/template/.eslintrc.js, thanks.

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  env: {
    browser: true,
    webextensions: true,
  },
  ignorePatterns: ['src/lib/google-*'],
  // https://github.com/vuejs/eslint-plugin-vue#priority-a-essential-error-prevention
  // consider switching to `plugin:vue/strongly-recommended` or `plugin:vue/recommended` for stricter rules.
  extends: [
    'plugin:vue/vue3-recommended',
    'airbnb-base',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
  ],
  // required to lint *.vue files
  plugins: ['vue', '@typescript-eslint', 'react'],
  // check if imports actually resolve
  settings: {
    react: {
      version: 'detect',
    },
    'import/resolver': {
      webpack: {
        config: './webpack.config.js',
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
      },
    },
  },
  // add your custom rules here
  globals: {
    BROWSER_TYPE: true,
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
    'prettier/prettier': [
      'error',
      {
        endOfLine: 'auto',
      },
    ],
    'import/extensions': [
      'error',
      'always',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
      },
    ],
    // disallow reassignment of function parameters
    // disallow parameter object manipulation except for specific exclusions
    'no-param-reassign': 'off',
    'import/no-extraneous-dependencies': 'off',
    // disallow default export over named export
    'import/prefer-default-export': 'off',
    // allow debugger during development
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
  },
};
