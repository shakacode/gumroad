const { RspackManifestPlugin } = require("rspack-manifest-plugin");
const { config: shakapacker, generateRspackConfig } = require("shakapacker/rspack");

const {
  assetRule,
  baseResolve,
  createPlugins,
  createScriptRules,
  mode,
  publicAssetPath,
  publicAssetUrl,
  publicOutputPath,
} = require("./common.cjs");
const SsrClientManifestPlugin = require("./ssrClientManifestPlugin.cjs");

shakapacker.publicPathWithoutCDN = publicAssetPath;
const shakapackerConfig = generateRspackConfig();
delete shakapackerConfig.entry["server-bundle"];
const manifestPlugin = shakapackerConfig.plugins.find((plugin) => plugin instanceof RspackManifestPlugin);
if (!manifestPlugin) throw new Error("Shakapacker's Rspack manifest plugin is missing.");
manifestPlugin.options.publicPath = publicAssetPath;

const environmentPlugin = shakapackerConfig.plugins.find(({ constructor }) => constructor.name === "EnvironmentPlugin");
if (environmentPlugin) {
  environmentPlugin.keys = environmentPlugin.keys.filter((key) => key !== "NODE_ENV");
  delete environmentPlugin.defaultValues.NODE_ENV;
}

module.exports = {
  ...shakapackerConfig,
  name: "public-rsc-client",
  mode,
  devtool: mode === "production" ? "nosources-source-map" : "cheap-module-source-map",
  resolve: {
    ...shakapackerConfig.resolve,
    ...baseResolve,
  },
  module: {
    ...shakapackerConfig.module,
    rules: [assetRule, ...createScriptRules()],
  },
  plugins: [...shakapackerConfig.plugins, ...createPlugins(false), new SsrClientManifestPlugin()],
  output: {
    ...shakapackerConfig.output,
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].js",
    clean: true,
    path: publicOutputPath,
    publicPath: publicAssetUrl,
  },
};
