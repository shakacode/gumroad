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
  name: "public-rsc-rsc",
  mode,
  devtool: "eval",
  entry: { "rsc-bundle": path.join(publicRscEntrypointsDirectory, "server.tsx") },
  resolve: {
    ...serverResolve,
    conditionNames: ["react-server", "..."],
    alias: {
      ...serverResolve.alias,
      "react-dom/server": false,
    },
  },
  target: "node",
  module: { rules: [assetRule, ...createScriptRules(true)] },
  optimization: { minimize: false },
  plugins: [...createPlugins(true), new optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  output: {
    filename: "rsc-bundle.js",
    globalObject: "this",
    library: { type: "commonjs2" },
    path: privateOutputPath,
  },
};
