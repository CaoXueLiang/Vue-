const { resolve } = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const { DefinePlugin } = require("webpack");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  mode: "development",
  entry: "/src/04_mustache模板引擎.js",
  output: {
    filename: "bundle.js",
    path: resolve(__dirname, "build"),
  },
  devServer: {
    hot: true,
    open: true,
    port: "8524",
  },
  plugins: [
    new CleanWebpackPlugin(),
    new HtmlWebpackPlugin({
      title: "mustache的基本使用",
      template: "./public/index.html",
    }),
    new DefinePlugin({
      BASE_URL: '"./"',
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: "public",
          globOptions: {
            ignore: ["**/index.html", "**/DS_Store"],
          },
        },
      ],
    }),
  ],
};
