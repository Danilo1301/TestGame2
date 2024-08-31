const path = require('path');
var WebpackObfuscator = require('webpack-obfuscator');

module.exports = {
    entry: './src/game/index.ts',
    plugins: [
        //new WebpackObfuscator({rotateStringArray: true, reservedStrings: [ '\s*' ]}, [])
    ],
    output: {
        filename: 'game.js',
        path: path.resolve(__dirname, '..', 'public')
    },
    resolve: {
        fallback: {
            "fs": false, // Tells Webpack not to polyfill the 'fs' module
            "path": false
        },
        extensions: [ '.ts', '.tsx', '.js' ],
        alias: {
          //'@cafemania': path.join(__dirname, 'src')
        }
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
            /*
            {
                enforce: 'post',
                use: {
                    loader: WebpackObfuscator.loader,
                    options: {
                        reservedStrings: [ '\s*' ],
                        rotateStringArray: true
                    }
                }
            }
            */
        ],
    },
    devtool: 'source-map',
    mode: 'development'
}