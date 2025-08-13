/* eslint-disable import/no-extraneous-dependencies */
import { crx } from '@crxjs/vite-plugin';
import VueI18n from '@intlify/unplugin-vue-i18n/vite';
import vue from '@vitejs/plugin-vue';
import { existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { defineConfig, type PluginOption, type UserConfig } from 'vite';
import VueDevTools from 'vite-plugin-vue-devtools';
import manifest from './src/manifest.config';

const IS_DEV = process.env.NODE_ENV === 'development';

function relativeFromHtml(htmlPath: string, to: string) {
  // dirname(htmlPath) is the HTML file path in dist; ensure relative path to /assets
  const parts = dirname(htmlPath).split('/');
  // Count depth and create ../../ prefix as needed
  const ups = parts
    .filter(Boolean)
    .map(() => '..')
    .join('/');
  return `${ups}${ups ? '/' : ''}${to.replace(/^\//, '')}`;
}

// Rewrites "/assets/..." in built HTML to be relative, avoiding CSP issues in extension pages
const assetsRewrite = (): PluginOption => {
  return {
    name: 'assets-rewrite',
    enforce: 'post',
    apply: 'build',
    transformIndexHtml(html: string, ctx: { path: string }) {
      return html.replace(
        /"\/assets\//g,
        `"${relativeFromHtml(ctx.path, '/assets')}/`
      );
    },
  };
};

export default defineConfig(({ mode }): UserConfig => {
  const devPort =
    process.env.VITE_DEV_SERVER_PORT || process.env.PORT || '5173';
  const secretsPath = existsSync(resolve(__dirname, `secrets.${mode}.js`))
    ? resolve(__dirname, `secrets.${mode}.js`)
    : resolve(__dirname, 'secrets.blank.js');

  const config: UserConfig = {
    plugins: [
      vue(),

      VueI18n({
        include: [resolve(__dirname, './src/locales/**')],
        compositionOnly: true,
        runtimeOnly: true,
      }),

      crx({
        manifest,
        contentScripts: {
          injectCss: true,
        },
      }),

      // DevTools 仅在 dev 启用
      ...(IS_DEV
        ? ([
            VueDevTools({
              componentInspector: true,
              launchEditor: 'cursor',
            }) as unknown as PluginOption,
          ] as PluginOption[])
        : []),

      assetsRewrite(),
    ],

    build: {
      watch: IS_DEV ? {} : undefined,
      sourcemap: IS_DEV ? 'inline' : false,
      minify: IS_DEV ? false : 'terser',
      terserOptions: {
        mangle: false,
        keep_classnames: IS_DEV,
        keep_fnames: IS_DEV,
      },
      rollupOptions: {
        input: {
          // Only business pages; functional pages are handled via manifest by crx
          sandbox: resolve(__dirname, 'src/sandbox/index.html'),
          execute: resolve(__dirname, 'src/execute/index.html'),
          newtab: resolve(__dirname, 'src/newtab/index.html'),
          params: resolve(__dirname, 'src/params/index.html'),
        },
      },
    },

    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        secrets: secretsPath,
        '@business': resolve(__dirname, 'business/dev'),
      },
    },

    css: {
      // Keep existing PostCSS chain (TailwindCSS v3 + autoprefixer)
      postcss: './postcss.config.js',
    },

    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: IS_DEV,
      __VUE_I18N_FULL_INSTALL__: JSON.stringify(true),
      __INTLIFY_PROD_DEVTOOLS__: JSON.stringify(false),
      __VUE_I18N_LEGACY_API__: JSON.stringify(false),
      BROWSER_TYPE: JSON.stringify(process.env.BROWSER || 'chrome'),
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      // do not expose numeric keys into runtime env defines to avoid Window indexed setter errors
    },

    server: IS_DEV
      ? {
          port: Number(devPort),
          strictPort: true,
          hmr: {
            port: Number(devPort),
            clientPort: Number(devPort),
          },
          host: 'localhost',
        }
      : undefined,
  };
  return config;
});
