/* eslint-env node */

const fs = require('node:fs');
const Module = require('node:module');
const path = require('node:path');
const babel = require('@babel/core');

const ROOT_DIR = path.resolve(__dirname, '../..');
const SOURCE_DIRS = [
  path.join(ROOT_DIR, 'src'),
  path.join(ROOT_DIR, 'business', 'dev'),
];
const moduleCache = new Map();

function withExtension(filePath) {
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return filePath;
  }
  if (fs.existsSync(`${filePath}.js`)) return `${filePath}.js`;
  if (fs.existsSync(path.join(filePath, 'index.js'))) {
    return path.join(filePath, 'index.js');
  }

  return null;
}

function resolveAlias(request) {
  if (request === '@business') return path.join(ROOT_DIR, 'business/dev');
  if (request === '@business/blocks') {
    return path.join(ROOT_DIR, 'business/dev/blocks');
  }
  if (request.startsWith('@/')) {
    return path.join(ROOT_DIR, 'src', request.slice(2));
  }

  return null;
}

function resolveSourceRequest(request, parentFilename) {
  const aliasPath = resolveAlias(request);
  if (aliasPath) return withExtension(aliasPath);

  if (request.startsWith('.')) {
    return withExtension(path.resolve(path.dirname(parentFilename), request));
  }

  return null;
}

function shouldCompile(filename) {
  return SOURCE_DIRS.some((dir) => filename.startsWith(dir));
}

function transformSource(source, filename) {
  const transformed = babel.transformSync(source, {
    babelrc: false,
    configFile: false,
    filename,
    presets: [
      [
        require.resolve('@babel/preset-env'),
        {
          modules: 'commonjs',
          targets: {
            node: 'current',
          },
        },
      ],
    ],
  });

  return transformed.code;
}

function loadSourceModule(request, parentFilename = __filename) {
  const resolved = path.isAbsolute(request)
    ? withExtension(request)
    : resolveSourceRequest(request, parentFilename);

  if (!resolved || !shouldCompile(resolved)) {
    return Module._load(request, module);
  }

  if (moduleCache.has(resolved)) return moduleCache.get(resolved).exports;

  const source = fs.readFileSync(resolved, 'utf8');
  const code = transformSource(source, resolved);
  const sourceModule = new Module(resolved, module.parent);
  sourceModule.filename = resolved;
  sourceModule.paths = Module._nodeModulePaths(path.dirname(resolved));
  sourceModule.require = (childRequest) => {
    if (childRequest === 'webextension-polyfill') {
      return {
        permissions: {
          contains: async () => false,
        },
      };
    }

    const childResolved = resolveSourceRequest(childRequest, resolved);
    if (childResolved && shouldCompile(childResolved)) {
      return loadSourceModule(childResolved, resolved);
    }

    return Module._load(childRequest, sourceModule);
  };

  moduleCache.set(resolved, sourceModule);
  sourceModule._compile(code, resolved);

  return sourceModule.exports;
}

module.exports = {
  loadSourceModule,
};
