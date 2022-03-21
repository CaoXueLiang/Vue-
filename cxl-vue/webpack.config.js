const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");

module.exports = {
  mode: "development",
  devtool: "source-map",
  entry: "./src/index.js",
  output: {
    filename: "bundle.js",
    path: path.resolve(__dirname, "dist"),
  },
  devServer: {
    open: true,
    static: {
      directory: path.join(__dirname, "src"),
    },
  },
  plugins: [
    new HtmlWebpackPlugin({
      title: "手写Vue1.x",
    }),
  ],
};
