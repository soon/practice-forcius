const webpack = require('webpack');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const {CleanWebpackPlugin} = require('clean-webpack-plugin');
const path = require('path');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtensionReloader = require('webpack-extension-reloader');

const projectRoot = __dirname;
const srcRoot = path.join(projectRoot, 'src');
const popupRoot = path.join(srcRoot, 'popup');
const backgroundRoot = path.join(srcRoot, 'background');


function filterNotFalsy(values) {
  return values.filter(x => x)
}

module.exports = function(env, args) {
  const isDevMode = args.mode === 'development';
  return {
    entry: {
      popup: path.join(popupRoot, 'index.ts'),
      background: path.join(backgroundRoot, 'index.ts'),
    },
    output: {
      path: path.join(projectRoot, 'dist'),
      filename: 'js/[name].js',
    },
    optimization: {
      splitChunks: {
        name: 'vendor',
        chunks: 'initial',
      },
    },
    module: {
      rules: [
        {
          test: /\.vue$/,
          loader: 'vue-loader',
          options: {
            loaders: {
              'scss': 'vue-style-loader!css-loader!sass-loader',
              'sass': 'vue-style-loader!css-loader!sass-loader?indentedSyntax',
            }
          }
        },
        {
          test: /\.tsx?$/,
          loader: 'ts-loader',
          exclude: /node_modules/,
          options: {
            appendTsSuffixTo: [/\.vue$/],
          }
        },
        {
          test: /\.s[ac]ss$/i,
          use: [
            'vue-style-loader',
            'css-loader',
            'sass-loader',
          ],
        },
        {
          test: /\.css$/,
          use: [
            'vue-style-loader',
            'css-loader',
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg|woff2)$/i,
          use: [
            {
              loader: 'file-loader',
              options: {
                esModule: false,
                outputPath: 'assets'
              }
            },
          ],
        },
      ],
    },
    resolve: {
      extensions: ['.ts', '.tsx', '.js'],
    },
    plugins: filterNotFalsy([
      new VueLoaderPlugin(),
      new CleanWebpackPlugin(),
      new webpack.IgnorePlugin(/^\.\/locale$/, /moment$/),
      new CopyWebpackPlugin([{
        from: 'src/manifest.json',
        transform(content) {
          if (!isDevMode) {
            return content;
          }
          const json = JSON.parse(content);
          json.name += ' (Develop)';
          return JSON.stringify(json);
        }
      }], {
        copyUnmodified: true,
        context: projectRoot
      }),
      new CopyWebpackPlugin([{
        from: isDevMode ? 'src/icon-dev.png' : 'src/icon.png',
        to: 'icon.png',
      }], {copyUnmodified: true, context: projectRoot}),
      new CopyWebpackPlugin([
        'src/icon128.png',
        'src/icon192.png',
        'src/icon192-trophy.png',
      ], {copyUnmodified: true, context: projectRoot}),
      new HtmlWebpackPlugin({
        title: 'Popup',
        template: 'src/index.html',
        filename: 'popup.html',
        chunks: ['popup', 'vendor'],
      }),
      isDevMode && new ExtensionReloader({
        entries: {
          background: 'background',
          extensionPage: 'popup',
        }
      })
    ]),
    devtool: isDevMode && 'inline-source-map' || undefined
  }
};
