const path = require('path');
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
    optimization: {
        minimize: true,
        mergeDuplicateChunks: false,
        removeAvailableModules: true,
        usedExports: true,
        concatenateModules: true,
    },
    plugins: [
        new BundleAnalyzerPlugin(),
        new CopyWebpackPlugin({
            patterns: [
                // {from: 'dist/index.js', to: '../public/toolkit/index.js'},
                {from: 'schemas/ridagop-toolkit.schema.json', to: '../public/toolkit/ridagop-toolkit.schema.json'},
            ],
        })
    ],
    stats: {
        errorDetails: true
    }
};