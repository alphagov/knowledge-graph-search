const path = require('path')
const webpack = require('webpack')

module.exports = {
  entry: './src/frontend/main.ts',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'public'),
  },
  entry: [
    './src/frontend/main.ts',
    'webpack-hot-middleware/client?reload=true', // This ensures the page fully reloads if HMR fails.
  ],
  plugins: [new webpack.HotModuleReplacementPlugin()],
}
