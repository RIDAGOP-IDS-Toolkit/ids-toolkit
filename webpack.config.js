const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const LodashWebpackPlugin = require('lodash-webpack-plugin');

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            {
                test: /\.js$/,
                enforce: 'pre',
                use: ['source-map-loader'],
            },
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'dist'),
    },
    devtool: 'inline-source-map',
    devServer: {
        watchFiles: ['src/**/*'],
        // ignore public folder
        static: {
            directory: path.join(__dirname, 'public'),
            publicPath: '/',
            watch: true,
        },
        client: {
            overlay: false,
        }
    },
    plugins: [
        // todo currently not included, cuz otherwise swagger-client will not work
        // new LodashWebpackPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './index.html'), // path to your index.html file
        }),
        new CopyWebpackPlugin({
            patterns: [
                {from: 'dist/index.js', to: '../public/toolkit/index.js'}
            ],
        })]
};