const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');

module.exports = {
  entry: './src/renderer/index.ts',
  target: 'electron-renderer',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'src/renderer/tsconfig.json'),
            transpileOnly: true,
          },
        },
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader'],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    fallback: {
      path: false,
      fs: false,
      crypto: false,
      stream: false,
      assert: false,
      util: false,
      buffer: false,
    },
  },
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/renderer'),
    clean: true,
    globalObject: 'this',
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/renderer/index.html',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'node_modules/swagger-ui-dist/swagger-ui-bundle.js'),
          to: 'vendor/swagger-ui-bundle.js',
        },
        {
          from: path.resolve(__dirname, 'node_modules/swagger-ui-dist/swagger-ui.css'),
          to: 'vendor/swagger-ui.css',
        },
        {
          from: path.resolve(__dirname, 'src/renderer/swagger-viewer.html'),
          to: 'swagger-viewer.html',
        },
      ],
    }),
    new webpack.DefinePlugin({
      'global': 'window',
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    }),
    new MonacoWebpackPlugin({
      languages: ['json', 'xml'],
      features: ['bracketMatching', 'folding', 'find', 'format'],
    }),
  ],
  devServer: {
    port: 3000,
    hot: true,
  },
};