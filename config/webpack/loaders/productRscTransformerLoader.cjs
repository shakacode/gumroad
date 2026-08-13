const path = require("path");
const ts = require("typescript");
const typiaTransform = require("typia/lib/transform").default;

function transformViteUrlGlobs(source) {
  return source.replace(
    /import\.meta\.glob(?:<[^>]+>)?\(\s*(["'])((?:\$assets\/)[^"']+)\/\*\1\s*,\s*\{\s*eager:\s*true,\s*query:\s*(["'])\?url\3,\s*import:\s*(["'])default\4,?\s*\}\s*\)/gu,
    (_match, _quote, directory) => `(() => {
  const context = require.context(${JSON.stringify(directory)}, false, /.+/);
  return Object.fromEntries(context.keys().map((key) => {
    const module = context(key);
    return [key, module.default ?? module];
  }));
})()`,
  );
}

function transformViteDynamicImports(source) {
  return source.replaceAll("/* @vite-ignore */", "/* webpackIgnore: true */");
}

module.exports = function productRscTransformerLoader(source) {
  this.cacheable();

  const configPath =
    this.getOptions().tsconfigPath ?? ts.findConfigFile(process.cwd(), ts.sys.fileExists, "tsconfig.json");
  const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
  const compilerOptions = ts.parseJsonConfigFileContent(configFile.config, ts.sys, path.dirname(configPath)).options;
  const sourceFile = ts.createSourceFile(
    this.resourcePath,
    transformViteDynamicImports(transformViteUrlGlobs(source)),
    compilerOptions.target,
    true,
  );
  const host = ts.createCompilerHost(compilerOptions);
  const originalGetSourceFile = host.getSourceFile.bind(host);

  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) =>
    fileName === this.resourcePath
      ? sourceFile
      : originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);

  const program = ts.createProgram([this.resourcePath], compilerOptions, host);
  const transformed = ts.transform(sourceFile, [typiaTransform(program)], compilerOptions);

  return ts.createPrinter().printFile(transformed.transformed[0]);
};
