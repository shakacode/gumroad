const { optimize } = require("@rspack/core");
const path = require("path");

const {
  createPlugins,
  createScriptRules,
  mode,
  privateOutputPath,
  publicRscPacksDirectory,
  serverAssetRule,
  serverResolve,
} = require("./common.cjs");

module.exports = {
  name: "public-rsc-server",
  dependencies: ["public-rsc-client"],
  mode,
  devtool: "eval",
  entry: { "server-bundle": path.join(publicRscPacksDirectory, "server-bundle.ts") },
  resolve: serverResolve,
  target: "node",
  module: { rules: [serverAssetRule, ...createScriptRules()] },
  optimization: { minimize: false },
  plugins: [...createPlugins(true), new optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  output: {
    filename: "server-bundle.js",
    globalObject: "this",
    library: { type: "commonjs2" },
    path: privateOutputPath,
  },
};
