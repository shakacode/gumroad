const { Compilation, sources } = require("@rspack/core");

class SsrClientManifestPlugin {
  apply(compiler) {
    compiler.hooks.thisCompilation.tap("SsrClientManifestPlugin", (compilation) => {
      compilation.hooks.processAssets.tap(
        { name: "SsrClientManifestPlugin", stage: Compilation.PROCESS_ASSETS_STAGE_REPORT },
        () => {
          const asset = compilation.getAsset("react-client-manifest.json");
          if (!asset) return;
          const manifest = JSON.parse(asset.source.source().toString());
          // Keep browser chunk URLs intact while leaving script initialization to the deferred packs.
          compilation.emitAsset(
            "react-client-ssr-manifest.json",
            new sources.RawSource(JSON.stringify({ ...manifest, moduleLoading: null })),
          );
        },
      );
    });
  }
}

module.exports = SsrClientManifestPlugin;
