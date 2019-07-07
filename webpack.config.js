module.exports = {
  entry: './src/main.js',
  output: {
    path: __dirname,
    filename: './dist/app.js'
  },
  module: {
    loaders: [{ test: /\.css$/, loader: 'style!css' }]
  }
};
