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
      files: ['**/*.js'],
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
      rules: {
        // 保证与根规则一致，避免因 override 的 extends 覆盖造成的差异
        'func-names': 'off',
        'no-param-reassign': 'off',
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        'no-underscore-dangle': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/prefer-default-export': 'off',
        'vue/multi-word-component-names': 'off',
        'vue/v-on-event-hyphenation': 'off',
      },
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
        // 解决使用 @typescript-eslint/parser 解析非标准拓展名（.vue）时报错的问题
        extraFileExtensions: ['.vue'],
      },
      extends: [
        'plugin:vue/vue3-recommended',
        'plugin:@typescript-eslint/recommended',
        'airbnb-base',
        'airbnb-typescript/base',
        'plugin:prettier/recommended',
      ],
      plugins: ['@typescript-eslint'],
      rules: {
        // 保证与根规则一致，避免因 override 的 extends 覆盖造成的差异
        'func-names': 'off',
        'no-param-reassign': 'off',
        'no-restricted-syntax': 'off',
        'no-await-in-loop': 'off',
        'no-underscore-dangle': 'off',
        'import/no-extraneous-dependencies': 'off',
        'import/prefer-default-export': 'off',
        'vue/multi-word-component-names': 'off',
        'vue/v-on-event-hyphenation': 'off',
      },
    },
  ],

  plugins: ['vue'],

  settings: {
    // 全局使用 alias 解析，避免解析 vite 配置
    'import/resolver': {
      node: { extensions: ['.js', '.ts', '.vue', '.json'] },
      // 注：移除 vite 解析器以避免 'viteConfig' 相关报错
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
    'import/no-unresolved': 'off',
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
