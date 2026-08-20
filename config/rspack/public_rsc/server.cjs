const { optimize } = require("@rspack/core");
const path = require("path");

const {
  assetRule,
  createPlugins,
  createScriptRules,
  mode,
  privateOutputPath,
  publicRscEntrypointsDirectory,
  serverResolve,
} = require("./common.cjs");

module.exports = {
  name: "public-rsc-server",
  mode,
  devtool: "eval",
  entry: { "server-bundle": path.join(publicRscEntrypointsDirectory, "server.tsx") },
  resolve: serverResolve,
  target: "node",
  module: { rules: [assetRule, ...createScriptRules()] },
  optimization: { minimize: false },
  plugins: [...createPlugins(true), new optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  output: {
    filename: "server-bundle.js",
    globalObject: "this",
    library: { type: "commonjs2" },
    path: privateOutputPath,
  },
};
