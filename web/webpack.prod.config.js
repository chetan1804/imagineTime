/**
 * sets up the .jsx compiler to read .jsx from ./client/
 * and output regular .js to /public/react/
 */

let ExtractTextPlugin = require('extract-text-webpack-plugin');
let OptimizeCssAssetsPlugin = require('optimize-css-assets-webpack-plugin');
let UglifyJSPlugin = require('uglifyjs-webpack-plugin')
let path = require('path');
let webpack = require('webpack');

const config = {
  devtool: 'cheap-module-source-map'
  , entry: {
    'react-bundle': './app.js.jsx'
    , outlook: './outlook.js.jsx'
    , desktop: './desktop.js.jsx'
    , uploadbox: './uploadbox.js.jsx'
  }
  , output: {
    path: path.join(__dirname, '../server/static/js')
    , filename: '[name].js'
  }
  , module: {
    loaders: [
      {
        loader: ExtractTextPlugin.extract({
          fallback: 'style-loader'
          , loader: "css-loader!sass-loader?importLoader=1&modules&localIdentName=[path]___[name]__[local]___[hash:base64:5]",
        })
        , test: /\.scss$/
      }
      , {
        include: path.resolve(__dirname, './'),
        loaders: [
          'style-loader',
          'css-loader?importLoader=1&modules&localIdentName=[path]___[name]__[local]___[hash:base64:5]'
        ],
        test: /\.css$/
      }
      , {
        exclude: /(node_modules|bower_components)/
        , loader: 'babel-loader'
        , query: {
          plugins: [
            [ 'react-css-modules', {
              context: path.resolve(__dirname, './')
              , filetypes: {
                ".scss": {
                  "syntax": "postcss-scss"
                }
              }
            }]
          ]
          , presets: ['env','react', 'stage-0']
        }
        , test: /\.jsx?$/
      }
    ]
  }
  , plugins: [
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production')
      }
    })
    , new UglifyJSPlugin({
      uglifyOptions: {
        compress: {
          warnings: false,
          drop_console: false
        }
        , comments: false
        , sourceMap: true
      }
    })
    // , new webpack.optimize.UglifyJsPlugin({
    //   compress: {
    //     warnings: false
    //     // , screw_ie8: true // yeah, screw IE8
    //   }
    //   , comments: false
    //   , sourceMap: true
    // })
    , new ExtractTextPlugin({
      filename: '../css/yote.css'
    })
    , new OptimizeCssAssetsPlugin({
      cssProcessorOptions: { discardComments: {removeAll: true } }
    })
  ]
}

module.exports = config;