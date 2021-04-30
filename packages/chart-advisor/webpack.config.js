const path = require('path');
module.exports = {
  mode: 'production',
  devtool: 'cheap-module-source-map',
  entry: './src/index',
  output: {
    library: 'Advisor',
    libraryTarget: 'umd',
    path: path.resolve(__dirname, 'dist/'),
    filename: 'index.js',
    chunkFilename: 'g2plot.js',
  },
  resolve: {
    extensions: ['.js', '.ts', '.json'],
    mainFields: ['module', 'browser', 'main'],
  },
  module: {
    rules: [
      {
        test: /\.ts/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-typescript', ['@babel/preset-env', { modules: 'commonjs' }]],
          plugins: ['@babel/plugin-proposal-class-properties', '@babel/plugin-proposal-object-rest-spread'],
        },
      },
    ],
  },
};
