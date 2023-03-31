'use strict';
const path = require('path');

module.exports =(env, argv) => {
    let devtool = false;
    if (argv.mode === "development") {
        devtool = "inline-source-map";
    }
    console.log(`${argv.mode} build`);
    const module = {
        rules: [
            {
                test: /\.([cm]?ts|tsx)$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: "ts-loader",
                    },
                ],
            },
        ],
       
    };
    return [
        {
            name: 'OneEuroFilter-umd',
            devtool,
            entry: './src/index.ts',
            output: {
                filename: 'OneEuroFilter.js',
                path: path.resolve(__dirname, 'dist'),
                libraryTarget: "umd",
            },
            resolve: {
                extensions: ['.ts', '.tsx', '.js'],
                extensionAlias: {
                    '.ts': ['.js', '.ts'],
                    '.cts': ['.cjs', '.cts'],
                    '.mts': ['.mjs', '.mts']
                }
            },
            module
        },
        {
            name: 'OneEuroFilter-esm',
            devtool,
            entry: './src/index.ts',
            experiments: {
                outputModule: true,
            },
            output: {
                filename: 'OneEuroFilter.mjs',
                path: path.resolve(__dirname, 'dist'),
                library: {
                    type: "module",
                },
            },
            resolve: {
                extensions: ['.ts', '.tsx', '.js'],
                extensionAlias: {
                    '.ts': ['.js', '.ts'],
                    '.cts': ['.cjs', '.cts'],
                    '.mts': ['.mjs', '.mts']
                }
            },
            module
        }
    ]
};