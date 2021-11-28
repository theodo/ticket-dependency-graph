module.exports = {
  entry: './src/main.js',
  mode: 'development',
  output: {
    filename: 'app.js',
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
          },
        },
      },
    ],
  },
  devServer: {
    static: './dist',
  },
  resolve: {
    alias: {
      vue$: 'vue/dist/vue.js',
    },
  },
};
