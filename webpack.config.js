const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-source-map',
  entry: {
    app: './demo/index',
  },
  output: {
    path: path.join(__dirname, './dist'),
    filename: 'bundle.js',
    chunkFilename: '[chunkhash].js',
    publicPath: '/',
  },
  externals: {
    react: 'React',
    'react-dom': 'ReactDOM',
    antd: 'antd',
  },
  target: 'web',
  resolve: {
    extensions: ['.js', '.ts', '.tsx', '.json'],
    mainFields: ['module', 'browser', 'main'],
  },
  module: {
    rules: [
      {
        test: /\.(t|j)sx?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        options: {
          presets: ['@babel/preset-typescript', ['@babel/preset-env', { modules: 'commonjs' }], '@babel/preset-react'],
          plugins: [
            '@babel/plugin-transform-runtime',
            '@babel/plugin-proposal-class-properties',
            '@babel/plugin-proposal-object-rest-spread',
          ],
        },
      },
      {
        test: /\.(css|less)$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { sourceMap: true } },
          {
            loader: 'less-loader',
            options: { sourceMap: true, javascriptEnabled: true },
          },
        ],
      },
    ],
  },
  devServer: {
    disableHostCheck: true,
    host: '0.0.0.0',
    hot: true,
    contentBase: path.join(__dirname, 'demo'),
  },
  plugins: [
    new webpack.IgnorePlugin({ resourceRegExp: /^(fs|child_process)$/ }),
    new webpack.EnvironmentPlugin({
      NODE_ENV: 'development',
    }),
  ],
};
