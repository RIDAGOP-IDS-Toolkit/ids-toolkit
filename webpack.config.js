const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = {
    mode: 'development',
    entry: './src/index.ts',
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
        path: path.resolve(__dirname, 'dist'),
        clean: true,
    },
    devtool: 'inline-source-map',
    optimization: {
        minimize: true,
        mergeDuplicateChunks: false,
        removeAvailableModules: true,
        usedExports: true,
        concatenateModules: true,
    },
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
        new BundleAnalyzerPlugin(),
        new HtmlWebpackPlugin({
            template: path.resolve(__dirname, './index.html'), // path to your index.html file
        }),
        new CopyWebpackPlugin({
            patterns: [
                {from: 'dist/index.js', to: '../public/toolkit/index.js'}
            ],
        })
    ],
    stats: {
        errorDetails: true
    }
};