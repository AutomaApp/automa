import { defineManifest } from '@crxjs/vite-plugin';
import pkg from '../package.json';

const getBrowser = () => process.env.BROWSER || 'chrome';
const isDev = () => process.env.NODE_ENV === 'development';
const isChrome = () => getBrowser() === 'chrome';
const isFirefox = () => getBrowser() === 'firefox';

function processVersion(version: string, browser: string) {
  if (version.includes('-')) {
    const [baseVersion, preRelease] = version.split('-');
    if (browser === 'chrome') {
      return {
        version: baseVersion,
        version_name: `${baseVersion} ${preRelease}`,
      };
    }
    return { version: `${baseVersion}${preRelease}` };
  }
  return { version };
}

const getBaseConfig = () => ({
  name: isDev() && isChrome() ? 'Automa-Dev' : 'Automa',
  description: (pkg as { description: string }).description,
  icons: {
    128:
      isDev() && isChrome()
        ? 'src/assets/images/icon-dev-128.png'
        : 'src/assets/images/icon-128.png',
  },
  commands: {
    'open-dashboard': {
      suggested_key: { default: 'Alt+A', mac: 'Alt+A' },
      description: 'Open the dashboard',
    },
    'element-picker': {
      suggested_key: { default: 'Alt+P', mac: 'Alt+P' },
      description: 'Open element picker',
    },
  },
  sandbox: {
    pages: ['src/sandbox/index.html'],
  },
});

const getChromeConfig = () => ({
  manifest_version: 3 as const,
  minimum_chrome_version: '116',
  action: {
    default_popup: 'src/popup/index.html',
    default_icon: isDev()
      ? 'src/assets/images/icon-dev-128.png'
      : 'src/assets/images/icon-128.png',
  },
  background: {
    service_worker: 'src/background/index.js', // crx handles bundling
    type: 'module' as const,
  },
  host_permissions: ['<all_urls>'],
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.js'],
      run_at: 'document_start',
      match_about_blank: true,
      all_frames: true,
    },
    {
      matches: [
        'http://localhost/*',
        '*://*.automa.site/*',
        '*://automa.vercel.app/*',
      ],
      js: ['src/content/services/webService.js'],
      run_at: 'document_start',
      all_frames: false,
    },
  ],
  optional_permissions: [
    'cookies',
    'downloads',
    'contextMenus',
    'clipboardRead',
    'notifications',
  ],
  permissions: [
    'tabs',
    'proxy',
    'alarms',
    'storage',
    'debugger',
    'activeTab',
    'offscreen',
    'webNavigation',
    'unlimitedStorage',
    'scripting',
  ],
  web_accessible_resources: [
    {
      resources: [
        'locales/*',
        isDev()
          ? 'src/assets/images/icon-dev-128.png'
          : 'src/assets/images/icon-128.png',
        'elementSelector.css',
        'src/content/elementSelector/index.js',
        'Inter-roman-latin.var.woff2',
        'src/offscreen/index.html',
      ],
      matches: ['*://*/*'],
    },
  ],
});

const getFirefoxConfig = () => ({
  manifest_version: 2 as const,
  browser_specific_settings: { gecko: { strict_min_version: '91.1.0' } },
  background: {
    scripts: ['src/background/index.js'],
    persistent: true,
  },
  browser_action: {
    default_popup: 'src/popup/index.html',
    default_icon: 'src/assets/images/icon-128.png',
  },
  content_scripts: [
    {
      matches: ['<all_urls>'],
      js: ['src/content/index.js'],
      run_at: 'document_start',
      all_frames: true,
    },
    {
      matches: ['*://*.automa.site/*', '*://automa.vercel.app/*'],
      js: ['src/content/services/webService.js'],
      run_at: 'document_start',
      all_frames: false,
    },
  ],
  optional_permissions: [
    'clipboardRead',
    'clipboardWrite',
    'downloads',
    'notifications',
    'cookies',
  ],
  permissions: [
    'tabs',
    'proxy',
    'menus',
    'alarms',
    'storage',
    'webNavigation',
    'unlimitedStorage',
    '<all_urls>',
  ],
  web_accessible_resources: [
    'elementSelector.css',
    'src/assets/images/icon-128.png',
    'Inter-roman-latin.var.woff2',
    'locales/*',
    'src/content/elementSelector/index.js',
  ],
  content_security_policy:
    "script-src 'self' 'unsafe-inline' https:; object-src 'self'",
});

export default defineManifest(() => {
  const base = getBaseConfig();
  const version = processVersion(
    (pkg as { version: string }).version,
    getBrowser()
  );

  const merged = {
    ...base,
    ...version,
    ...(isFirefox() ? getFirefoxConfig() : getChromeConfig()),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as unknown as any;

  return merged;
});
