const path = require('path');

module.exports = {
  entry: './src/main.js',
  mode: 'development',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'app.js',
  },
  module: {
    rules: [{ test: /\.css$/, loader: 'style!css' }],
  },
  devServer: {
    contentBase: './',
    publicPath: '/dist/',
  },
};
