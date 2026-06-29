/* eslint-env node */

const assert = require('node:assert/strict');
const test = require('node:test');

const { loadSourceModule } = require('./testBabelLoader');

const { validateBlock } = loadSourceModule(
  './blockValidationStructured',
  __filename
);

test('rejects unknown blocks in strict mode and accepts them with unsafeRaw', async () => {
  const strictResult = await validateBlock('missing-block', { raw: true });

  assert.deepEqual(strictResult.errors, [
    {
      alias: 'missing-block',
      blockId: 'missing-block',
      code: 'unknown_block_type',
      message: 'Unknown block type "missing-block"',
      path: 'type',
      severity: 'error',
    },
  ]);
  assert.deepEqual(strictResult.normalizedData, { raw: true });

  const unsafeResult = await validateBlock(
    'missing-block',
    { raw: true },
    { unsafeRaw: true }
  );

  assert.deepEqual(unsafeResult.errors, []);
  assert.equal(unsafeResult.warnings[0].code, 'unknown_block_type');
  assert.equal(unsafeResult.warnings[0].severity, 'warning');
  assert.deepEqual(unsafeResult.normalizedData, { raw: true });
});

test('merges catalog defaults into normalizedData before validation', async () => {
  const result = await validateBlock(
    'new-tab',
    {
      url: 'https://example.com',
    },
    {
      dependencies: {
        permissionsContains: async () => true,
      },
    }
  );

  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.equal(result.normalizedData.url, 'https://example.com');
  assert.equal(result.normalizedData.active, true);
  assert.equal(result.normalizedData.tabZoom, 1);
  assert.equal(result.normalizedData.disableBlock, false);
});

test('normalizes duplicate, missing, and invalid parameter strings', async () => {
  const result = await validateBlock(
    'new-tab',
    {},
    {
      alias: 'Open Page',
      blockId: 'node-1',
      blocksValidation: {
        'new-tab': {
          func: async () => [
            'URL is empty',
            'Duplicate parameter "url"',
            'Invalid parameter "mode"',
          ],
        },
      },
    }
  );

  assert.deepEqual(
    result.errors.map((error) => ({
      alias: error.alias,
      blockId: error.blockId,
      code: error.code,
      path: error.path,
      severity: error.severity,
    })),
    [
      {
        alias: 'Open Page',
        blockId: 'node-1',
        code: 'missing_parameter',
        path: 'data.url',
        severity: 'error',
      },
      {
        alias: 'Open Page',
        blockId: 'node-1',
        code: 'duplicate_parameter',
        path: 'data.url',
        severity: 'error',
      },
      {
        alias: 'Open Page',
        blockId: 'node-1',
        code: 'invalid_parameter',
        path: 'data',
        severity: 'error',
      },
    ]
  );
});

test('normalizes thrown validator errors without leaking thrown messages', async () => {
  const result = await validateBlock(
    'new-tab',
    {},
    {
      blocksValidation: {
        'new-tab': {
          func: async () => {
            throw new Error('payload contained password=secret');
          },
        },
      },
    }
  );

  assert.deepEqual(result.errors, [
    {
      alias: 'new-tab',
      blockId: 'new-tab',
      code: 'validator_error',
      message: 'Validator failed',
      path: 'data',
      severity: 'error',
    },
  ]);
});

test('preserves warning versus blocking error semantics', async () => {
  const result = await validateBlock(
    'export-data',
    {
      dataToExport: 'variable',
      variableName: '',
    },
    {
      dependencies: {
        permissionsContains: async () => false,
      },
    }
  );

  assert.equal(result.warnings.length, 1);
  assert.equal(result.warnings[0].code, 'missing_permission');
  assert.equal(result.warnings[0].severity, 'warning');
  assert.equal(result.errors.length, 1);
  assert.equal(result.errors[0].code, 'missing_parameter');
  assert.equal(result.errors[0].path, 'data.variableName');

  const grantedResult = await validateBlock(
    'save-assets',
    {
      selector: '',
      type: 'element',
    },
    {
      dependencies: {
        permissionsContains: async () => true,
      },
    }
  );

  assert.deepEqual(grantedResult.warnings, []);
  assert.equal(grantedResult.errors[0].code, 'missing_parameter');
  assert.equal(grantedResult.errors[0].path, 'data.selector');
});

test('injects browser type and permission dependencies into validators', async () => {
  const chromePermissions = [];
  const chromeResult = await validateBlock(
    'trigger',
    {
      type: 'context-menu',
    },
    {
      dependencies: {
        browserType: 'chrome',
        permissionsContains: async (permissions) => {
          chromePermissions.push(permissions);
          return false;
        },
      },
    }
  );

  assert.deepEqual(chromePermissions, [['contextMenus']]);
  assert.equal(chromeResult.warnings[0].code, 'missing_permission');

  const firefoxPermissions = [];
  const firefoxResult = await validateBlock(
    'trigger',
    {
      contextMenuName: '',
      type: 'context-menu',
    },
    {
      dependencies: {
        browserType: 'firefox',
        permissionsContains: async (permissions) => {
          firefoxPermissions.push(permissions);
          return true;
        },
      },
    }
  );

  assert.deepEqual(firefoxPermissions, [['menus']]);
  assert.equal(firefoxResult.errors[0].code, 'missing_parameter');
  assert.equal(firefoxResult.errors[0].path, 'data.contextMenuName');

  const clipboardPermissions = [];
  const clipboardResult = await validateBlock(
    'clipboard',
    {},
    {
      dependencies: {
        browserType: 'firefox',
        permissionsContains: async (permissions) => {
          clipboardPermissions.push(permissions);
          return false;
        },
      },
    }
  );

  assert.deepEqual(clipboardPermissions, [['clipboardRead', 'clipboardWrite']]);
  assert.equal(clipboardResult.warnings[0].code, 'missing_permission');
});

test('runs without a browser context by using safe permission defaults', async () => {
  const result = await validateBlock('notification', {});

  assert.deepEqual(result.errors, []);
  assert.equal(result.warnings[0].code, 'missing_permission');
  assert.equal(result.warnings[0].severity, 'warning');
});

test('blocks unsafe custom and saved block data in strict mode', async () => {
  const customResult = await validateBlock(
    'custom-unsafe',
    { value: 1 },
    {
      blocks: {
        'custom-unsafe': {
          name: 'Custom unsafe',
        },
      },
    }
  );

  assert.equal(customResult.errors[0].code, 'unsafe_custom_block');
  assert.deepEqual(customResult.warnings, []);

  const unsafeCustomResult = await validateBlock(
    'custom-unsafe',
    { value: 1 },
    {
      blocks: {
        'custom-unsafe': {
          name: 'Custom unsafe',
        },
      },
      unsafeRaw: true,
    }
  );

  assert.deepEqual(unsafeCustomResult.errors, []);
  assert.equal(unsafeCustomResult.warnings[0].code, 'unsafe_custom_block');

  const savedResult = await validateBlock('block-package', {
    data: {
      nodes: [],
    },
    settings: {
      asBlock: true,
    },
  });

  assert.equal(savedResult.errors[0].code, 'unsafe_saved_block');
});
