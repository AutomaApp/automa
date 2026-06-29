import browser from 'webextension-polyfill';
import { createBlocksValidation } from './blocksValidationCore';

export * from './blocksValidationCore';

const browserType = typeof BROWSER_TYPE === 'string' ? BROWSER_TYPE : 'chrome';

export default createBlocksValidation({
  browserType,
  permissionsContains: (permissions) =>
    browser.permissions.contains({ permissions }),
});
