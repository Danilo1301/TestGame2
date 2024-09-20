const path = require('path');

module.exports = {
  entry: './src/lib/index.ts', // Entry point of your server application
  target: 'node',           // Webpack should bundle for Node.js, not browser
  mode: 'development',       // Can also be 'development' or 'production'
  output: {
    path: path.resolve(__dirname, '..', 'dist'),  // Output directory
    filename: 'gameLib.js',                   // Output file
  },
  resolve: {
    extensions: ['.ts', '.js'],             // Resolve these extensions
  },
  module: {
    rules: [
      {
        test: /\.ts$/,                      // Use ts-loader for .ts files
        use: 'ts-loader',
        exclude: /node_modules/,            // Exclude node_modules from transpiling
      },
    ],
  }
};