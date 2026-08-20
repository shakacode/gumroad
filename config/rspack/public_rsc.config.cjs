const { DefinePlugin, ProvidePlugin, optimize } = require("@rspack/core");
const fs = require("fs");
const path = require("path");
const { RSCRspackPlugin } = require("react-on-rails-rsc/RspackPlugin");

const rootPath = path.resolve(__dirname, "../..");
const sourcePath = path.join(rootPath, "app/javascript");
const privateOutputPath = path.join(rootPath, "ssr-generated");
const publicOutputPath = path.join(rootPath, "public/product-rsc");
const buildEnvironment = process.env.NODE_ENV || process.env.RAILS_ENV || "development";
const mode = ["production", "staging"].includes(buildEnvironment) ? "production" : "development";
const publicRscEntrypointsDirectory = path.join(sourcePath, "entrypoints/public_rsc");
const hasPublicRscEntry = fs.existsSync(publicRscEntrypointsDirectory);
const publicRscClientReferences = [
  ["components/Product", /ProductPage\.tsx$/u],
  ["components/Discover", /DiscoverPage\.tsx$/u],
  ["components/Profile", /ProfileRscCompatibilityPage\.client\.tsx$/u],
  ["components/PublicPages", /PageShell\.client\.tsx$/u],
].map(([directory, include]) => ({ directory: path.join(sourcePath, directory), recursive: false, include }));
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

const baseResolve = {
  extensions: [".js", ".mjs", ".ts", ".tsx", ".json"],
  modules: [sourcePath, "node_modules"],
  alias: {
    $app: sourcePath,
    $assets: path.join(rootPath, "public"),
    $vendor: path.join(rootPath, "vendor/assets/javascripts"),
    jwplayer: path.join(rootPath, "vendor/assets/components/jwplayer-7.12.13/jwplayer"),
  },
};

const serverResolve = {
  ...baseResolve,
  alias: {
    ...baseResolve.alias,
    "@rails/activestorage": path.join(__dirname, "activestorage_server.js"),
  },
};

const swcLoader = (syntax, tsx = false, moduleType) => ({
  loader: "builtin:swc-loader",
  options: {
    jsc: {
      parser: { syntax, ...(syntax === "typescript" ? { tsx } : { jsx: true }) },
      target: "es2019",
      transform: { react: { runtime: "automatic" } },
    },
    ...(moduleType ? { module: { type: moduleType } } : {}),
  },
});

const createScriptRules = (rscBundle = false) => [
  {
    test: /\.tsx$/u,
    exclude: /node_modules/u,
    use: [
      swcLoader("typescript", true),
      ...(rscBundle ? [{ loader: "react-on-rails-rsc/WebpackLoader" }] : []),
      { loader: path.join(__dirname, "loaders/productRscTransformerLoader.cjs") },
    ],
  },
  {
    test: /\.ts$/u,
    exclude: /node_modules/u,
    use: [
      swcLoader("typescript"),
      ...(rscBundle ? [{ loader: "react-on-rails-rsc/WebpackLoader" }] : []),
      { loader: path.join(__dirname, "loaders/productRscTransformerLoader.cjs") },
    ],
  },
  {
    test: /\.(?:js|mjs)$/u,
    exclude: /node_modules/u,
    use: [swcLoader("ecmascript"), ...(rscBundle ? [{ loader: "react-on-rails-rsc/WebpackLoader" }] : [])],
  },
  {
    test: /\.cjs$/u,
    exclude: /node_modules/u,
    use: [
      swcLoader("ecmascript", false, "commonjs"),
      ...(rscBundle ? [{ loader: "react-on-rails-rsc/WebpackLoader" }] : []),
    ],
  },
];

const assetRule = {
  test: /\.(?:bmp|gif|jpe?g|png|tiff|ico|avif|webp|eot|otf|ttf|woff2?|svg)$/u,
  type: "asset",
  generator: { filename: "static/[hash][ext][query]" },
};

const plugins = (ssr) => [
  new DefinePlugin({ SSR: JSON.stringify(ssr) }),
  new ProvidePlugin({ Routes: path.join(sourcePath, "utils/routes.js") }),
  ...(hasPublicRscEntry
    ? [
        new RSCRspackPlugin({
          isServer: ssr,
          clientReferences: publicRscClientReferences,
        }),
      ]
    : []),
];

const clientConfig = {
  name: "public-rsc-client",
  mode,
  devtool: mode === "production" ? "nosources-source-map" : "cheap-module-source-map",
  entry: { product_rsc: path.join(publicRscEntrypointsDirectory, "client.tsx") },
  resolve: baseResolve,
  module: { rules: [assetRule, ...createScriptRules()] },
  plugins: [...plugins(false), new PublicRscAssetManifestPlugin()],
  output: {
    filename: "[name].[contenthash:8].js",
    chunkFilename: "[name].[contenthash:8].js",
    clean: true,
    path: publicOutputPath,
    publicPath: "/product-rsc/",
  },
};

const serverConfig = {
  name: "public-rsc-server",
  mode,
  devtool: "eval",
  entry: { "server-bundle": path.join(publicRscEntrypointsDirectory, "server.tsx") },
  resolve: serverResolve,
  target: "node",
  module: { rules: [assetRule, ...createScriptRules()] },
  optimization: { minimize: false },
  plugins: [...plugins(true), new optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  output: {
    filename: "server-bundle.js",
    globalObject: "this",
    library: { type: "commonjs2" },
    path: privateOutputPath,
  },
};

const rscConfig = {
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
  plugins: [...plugins(true), new optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  output: {
    filename: "rsc-bundle.js",
    globalObject: "this",
    library: { type: "commonjs2" },
    path: privateOutputPath,
  },
};

module.exports = [clientConfig, serverConfig, rscConfig];
