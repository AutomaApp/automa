const webpack = require('webpack');
const path = require('path');
const fileSystem = require('fs-extra');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const env = require('./utils/env');

const ASSET_PATH = process.env.ASSET_PATH || '/';

const alias = {
  '@': path.resolve(__dirname, 'src/'),
  secrets: path.join(__dirname, 'secrets.blank.js'),
};

// load the secrets
const secretsPath = path.join(__dirname, `secrets.${env.NODE_ENV}.js`);

const fileExtensions = [
  'jpg',
  'jpeg',
  'png',
  'gif',
  'eot',
  'otf',
  'svg',
  'ttf',
  'woff',
  'woff2',
];

if (fileSystem.existsSync(secretsPath)) {
  alias.secrets = secretsPath;
}

const options = {
  mode: process.env.NODE_ENV || 'development',
  entry: {
    newtab: path.join(__dirname, 'src', 'newtab', 'index.js'),
    popup: path.join(__dirname, 'src', 'popup', 'index.js'),
    background: path.join(__dirname, 'src', 'background', 'index.js'),
    contentScript: path.join(__dirname, 'src', 'content', 'index.js'),
    recordWorkflow: path.join(
      __dirname,
      'src',
      'content',
      'services',
      'recordWorkflow.js'
    ),
    shortcutListener: path.join(
      __dirname,
      'src',
      'content',
      'services',
      'shortcutListener.js'
    ),
    webService: path.join(
      __dirname,
      'src',
      'content',
      'services',
      'webService.js'
    ),
    elementSelector: path.join(
      __dirname,
      'src',
      'content',
      'elementSelector',
      'index.js'
    ),
  },
  chromeExtensionBoilerplate: {
    notHotReload: [
      'webService',
      'contentScript',
      'recordWorkflow',
      'elementSelector',
      'shortcutListener',
    ],
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: '[name].bundle.js',
    publicPath: ASSET_PATH,
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
          },
          {
            loader: 'postcss-loader',
          },
        ],
      },
      {
        test: /\.(json5?|ya?ml)$/, // target json, json5, yaml and yml files
        type: 'javascript/auto',
        // Use `Rule.include` to specify the files of locale messages to be pre-compiled
        include: [path.resolve(__dirname, './src/locales')],
        loader: '@intlify/vue-i18n-loader',
      },
      {
        test: new RegExp(`.(${fileExtensions.join('|')})$`),
        loader: 'file-loader',
        type: 'javascript/auto',
        options: {
          name: '[name].[ext]',
        },
        exclude: /node_modules/,
      },
      {
        test: /\.js$/,
        use: [
          {
            loader: 'source-map-loader',
          },
          {
            loader: 'babel-loader',
          },
        ],
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    alias,
    extensions: fileExtensions
      .map((extension) => `.${extension}`)
      .concat(['.js', '.vue', '.css']),
  },
  plugins: [
    new MiniCssExtractPlugin(),
    new VueLoaderPlugin(),
    new webpack.DefinePlugin({
      BROWSER_TYPE: JSON.stringify(env.BROWSER),
    }),
    new webpack.ProgressPlugin(),
    // clean the build folder
    new CleanWebpackPlugin({
      verbose: true,
      cleanStaleWebpackAssets: true,
    }),
    // expose and write the allowed env vars on the compiled bundle
    new webpack.EnvironmentPlugin(['NODE_ENV']),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: `src/manifest.${env.BROWSER}.json`,
          to: path.join(__dirname, 'build', 'manifest.json'),
          force: true,
          toType: 'file',
          transform(content) {
            const manifestObj = {
              description: process.env.npm_package_description,
              version: process.env.npm_package_version,
              ...JSON.parse(content.toString()),
            };
            const isChrome = env.BROWSER === 'chrome';

            if (env.NODE_ENV === 'development' && !isChrome) {
              manifestObj.content_security_policy =
                "script-src 'self' 'unsafe-eval'; object-src 'self'";
            }
            if (manifestObj.version.includes('-')) {
              const [version, preRelease] = manifestObj.version.split('-');

              if (isChrome) {
                manifestObj.version = version;
                manifestObj.version_name = `${version} ${preRelease}`;
              } else {
                manifestObj.version = `${version}${preRelease}`;
              }
            }

            return Buffer.from(JSON.stringify(manifestObj));
          },
        },
        {
          from: 'src/assets/images/icon-128.png',
          to: path.join(__dirname, 'build'),
          force: true,
        },
      ],
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'newtab', 'index.html'),
      filename: 'newtab.html',
      chunks: ['newtab'],
      cache: false,
    }),
    new HtmlWebpackPlugin({
      template: path.join(__dirname, 'src', 'popup', 'index.html'),
      filename: 'popup.html',
      chunks: ['popup'],
      cache: false,
    }),
    new webpack.DefinePlugin({
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
    }),
  ],
  infrastructureLogging: {
    level: 'info',
  },
};

if (env.NODE_ENV === 'development') {
  options.devtool = 'cheap-module-source-map';
} else {
  options.optimization = {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  };
}

module.exports = options;
