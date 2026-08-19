const { DefinePlugin, ProvidePlugin, optimize } = require("@rspack/core");
const path = require("path");

const rootPath = path.resolve(__dirname, "../..");
const sourcePath = path.join(rootPath, "app/javascript");
const privateOutputPath = path.join(rootPath, "ssr-generated");
const publicOutputPath = path.join(rootPath, "public/product-rsc");
const buildEnvironment = process.env.NODE_ENV || process.env.RAILS_ENV || "development";
const mode = ["production", "staging"].includes(buildEnvironment) ? "production" : "development";
const productRscClientReferencesDirectory = path.join(sourcePath, "product_rsc");

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

const createScriptRules = () => [
  {
    test: /\.tsx$/u,
    exclude: /node_modules/u,
    use: [swcLoader("typescript", true), { loader: path.join(__dirname, "loaders/productRscTransformerLoader.cjs") }],
  },
  {
    test: /\.ts$/u,
    exclude: /node_modules/u,
    use: [swcLoader("typescript"), { loader: path.join(__dirname, "loaders/productRscTransformerLoader.cjs") }],
  },
  {
    test: /\.(?:js|mjs)$/u,
    exclude: /node_modules/u,
    use: [swcLoader("ecmascript")],
  },
  {
    test: /\.cjs$/u,
    exclude: /node_modules/u,
    use: [swcLoader("ecmascript", false, "commonjs")],
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
];

const clientConfig = {
  name: "product-rsc-client",
  mode,
  devtool: mode === "production" ? "nosources-source-map" : "cheap-module-source-map",
  entry: { product_rsc: path.join(productRscClientReferencesDirectory, "client_entry.tsx") },
  resolve: baseResolve,
  module: { rules: [assetRule, ...createScriptRules()] },
  plugins: plugins(false),
  output: {
    filename: "[name].js",
    path: publicOutputPath,
    publicPath: "/product-rsc/",
  },
};

const serverConfig = {
  name: "product-rsc-server",
  mode,
  devtool: "eval",
  entry: { "server-bundle": path.join(productRscClientReferencesDirectory, "server_entry.tsx") },
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

module.exports = [clientConfig, serverConfig];
