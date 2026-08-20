const { DefinePlugin, ProvidePlugin } = require("@rspack/core");
const path = require("path");
const { RSCRspackPlugin } = require("react-on-rails-rsc/RspackPlugin");

const rootPath = path.resolve(__dirname, "../../..");
const sourcePath = path.join(rootPath, "app/javascript");
const privateOutputPath = path.join(rootPath, "ssr-generated");
const publicOutputPath = path.join(rootPath, "public/product-rsc");
const publicRscEntrypointsDirectory = path.join(sourcePath, "entrypoints/public_rsc");
const buildEnvironment = process.env.NODE_ENV || process.env.RAILS_ENV || "development";
const mode = ["production", "staging"].includes(buildEnvironment) ? "production" : "development";

const publicRscClientReferences = [{ directory: sourcePath, recursive: true, include: /\.[cm]?[jt]sx?$/u }];

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
    "@rails/activestorage": path.join(__dirname, "../activestorage_server.js"),
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
      { loader: path.join(__dirname, "../loaders/productRscTransformerLoader.cjs") },
    ],
  },
  {
    test: /\.ts$/u,
    exclude: /node_modules/u,
    use: [
      swcLoader("typescript"),
      ...(rscBundle ? [{ loader: "react-on-rails-rsc/WebpackLoader" }] : []),
      { loader: path.join(__dirname, "../loaders/productRscTransformerLoader.cjs") },
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

const createPlugins = (ssr) => [
  new DefinePlugin({ SSR: JSON.stringify(ssr) }),
  new ProvidePlugin({ Routes: path.join(sourcePath, "utils/routes.js") }),
  new RSCRspackPlugin({
    isServer: ssr,
    clientReferences: publicRscClientReferences,
  }),
];

module.exports = {
  assetRule,
  baseResolve,
  createPlugins,
  createScriptRules,
  mode,
  privateOutputPath,
  publicOutputPath,
  publicRscEntrypointsDirectory,
  serverResolve,
};
