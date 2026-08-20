const path = require("path");

const {
  assetRule,
  baseResolve,
  createPlugins,
  createScriptRules,
  mode,
  publicOutputPath,
  publicRscEntrypointsDirectory,
} = require("./common.cjs");

const publicRscAssetManifest = "asset-manifest.json";

class PublicRscAssetManifestPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("PublicRscAssetManifestPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        {
          name: "PublicRscAssetManifestPlugin",
          stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          const entryFile = compilation.entrypoints
            .get("product_rsc")
            ?.getFiles()
            .find((file) => file.endsWith(".js"));

          if (!entryFile) throw new Error("Missing product RSC client entry");

          const manifest = JSON.stringify({ "product_rsc.js": entryFile }, null, 2);
          compilation.emitAsset(publicRscAssetManifest, new compiler.webpack.sources.RawSource(`${manifest}\n`));
        },
      );
    });
  }
}

module.exports = {
  name: "public-rsc-client",
  mode,
  devtool: mode === "production" ? "nosources-source-map" : "cheap-module-source-map",
  entry: { product_rsc: path.join(publicRscEntrypointsDirectory, "client.tsx") },
  resolve: baseResolve,
  module: { rules: [assetRule, ...createScriptRules()] },
  plugins: [...createPlugins(false), new PublicRscAssetManifestPlugin()],
  output: {
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].js",
    clean: true,
    path: publicOutputPath,
    publicPath: "/product-rsc/",
  },
};
