const path = require('path')
const webpack = require('webpack')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

module.exports = (env) => ({
  mode: 'development',
  entry: {
    main: env?.enableHMR
      ? ['./src/frontend/main.ts', 'webpack-hot-middleware/client?reload=true']
      : './src/frontend/main.ts',
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
          },
        ],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  output: {
    filename: 'javascripts/[name].js',
    path: path.resolve(__dirname, 'public'),
  },
  plugins: [
    env?.enableHMR
      ? new webpack.HotModuleReplacementPlugin()
      : new MiniCssExtractPlugin({
          filename: 'stylesheets/[name].css',
        }),
    new webpack.DefinePlugin({
      buildConfig: {
        ENABLE_HMR: env?.enableHMR,
      },
    }),
  ],
})
