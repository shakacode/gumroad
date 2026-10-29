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
  name: "public-rsc-rsc",
  dependencies: ["public-rsc-server"],
  mode,
  devtool: "eval",
  entry: { "rsc-bundle": path.join(publicRscPacksDirectory, "server-bundle.ts") },
  resolve: {
    ...serverResolve,
    conditionNames: ["react-server", "..."],
    alias: {
      ...serverResolve.alias,
      "react-dom/server": false,
    },
  },
  target: "node",
  module: { rules: [serverAssetRule, ...createScriptRules(true)] },
  optimization: { minimize: false },
  plugins: [...createPlugins(true, false), new optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  output: {
    filename: "rsc-bundle.js",
    globalObject: "this",
    library: { type: "commonjs2" },
    path: privateOutputPath,
  },
};
