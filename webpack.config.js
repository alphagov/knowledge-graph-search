const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env) => ({
  mode: 'development',
  entry: {
    main: [
      './src/frontend/main.ts',
      env?.enableHMR ? 'webpack-hot-middleware/client?reload=true' : '',
    ],
    styles: './src/frontend/scss/main.scss',
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
      {
        test: /\.scss$/,
        use: [
          env?.enableHMR ? 'style-loader' : MiniCssExtractPlugin.loader,
          {
            loader: 'css-loader',
            options: { url: { filter: (url) => !url.startsWith('/assets') } },
          },
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                quiet: true,
              },
            },
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: '[name].js', // Use [name] to output different filenames for different entry points
    path: path.resolve(__dirname, 'public'),
  },
  plugins: [
    env?.enableHMR
      ? new webpack.HotModuleReplacementPlugin()
      : new MiniCssExtractPlugin({
          filename: '[name].css',
        }),
    new webpack.DefinePlugin({
      buildConfig: {
        ENABLE_HMR: env?.enableHMR,
      },
    }),
  ],
})
