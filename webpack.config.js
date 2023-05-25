const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const fs = require('fs');

const entries = {};
const fileNames = fs.readdirSync('./src/ts/').filter((a) => !isNaN(Number(a))).forEach((a) => {
  entries[`main${a}`] = `./src/ts/${a}/main.ts`;
});

module.exports = {
  entry: entries,
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
    filename: '[name].js',
    path: path.resolve(__dirname, 'public'),
  },


  plugins: [
    new CopyWebpackPlugin({
      patterns: [{
        from: require.resolve('./node_modules/govuk-frontend/govuk/all.js'),
        to: './assets/all.js'
      },{
        from: require.resolve('./node_modules/govuk-frontend/govuk/all.js.map'),
        to: './assets/all.js.map'
      },{
        from: require.resolve('./node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js'),
        to: './assets/accessible-autocomplete.min.js'
      },{
        from: require.resolve('./node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.css'),
        to: './assets/aaccessible-autocomplete.min.css'
      },{
        from: require.resolve('./node_modules/accessible-autocomplete/dist/accessible-autocomplete.min.js.map'),
        to: './assets/accessible-autocomplete.min.js.map'
      }]
    })
  ]
};
