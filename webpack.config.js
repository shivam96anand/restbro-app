const path = require('path');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const isDevelopment = process.env.NODE_ENV !== 'production';

module.exports = [
  // Main process configuration
  {
    target: 'electron-main',
    mode: isDevelopment ? 'development' : 'production',
    entry: './src/main/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist/main'),
      filename: 'index.js',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
    devtool: isDevelopment ? 'inline-source-map' : false,
  },
  // Preload process configuration
  {
    target: 'electron-preload',
    mode: isDevelopment ? 'development' : 'production',
    entry: './src/preload/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist/preload'),
      filename: 'index.js',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
      ],
    },
    node: {
      __dirname: false,
      __filename: false,
    },
    devtool: isDevelopment ? 'inline-source-map' : false,
  },
  // Renderer process configuration
  {
    target: 'electron-renderer',
    mode: isDevelopment ? 'development' : 'production',
    entry: './src/renderer/index.ts',
    output: {
      path: path.resolve(__dirname, 'dist/renderer'),
      filename: 'bundle.js',
    },
    resolve: {
      extensions: ['.ts', '.js'],
    },
    module: {
      rules: [
        {
          test: /\.ts$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.css$/i,
          use: [
            isDevelopment ? 'style-loader' : MiniCssExtractPlugin.loader,
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.html$/i,
          loader: 'html-loader',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
        filename: 'index.html',
        inject: 'body',
      }),
      ...(isDevelopment ? [] : [
        new MiniCssExtractPlugin({
          filename: 'styles.css',
        }),
      ]),
    ],
    devtool: isDevelopment ? 'inline-source-map' : false,
  },
];
