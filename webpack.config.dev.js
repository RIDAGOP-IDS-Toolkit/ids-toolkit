const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
    devtool: 'inline-source-map',
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            }
        ],
    },
    resolve: {
        extensions: ['.tsx', '.ts', '.js']
    },
    output: {
        filename: 'index.js',
        path: path.resolve(__dirname, 'public'),
    },
    devServer: {
        client: {
            overlay: false, // This disables the error overlay
        }
        //     contentBase: path.join(__dirname, 'public'),
        //     compress: true,
        //     // publicPath: '/', // this is also needed for the dev server
    },
    stats: {
        errorDetails: false
    }
};