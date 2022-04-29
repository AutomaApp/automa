import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n/dist/vue-i18n.esm-bundler';
import { supportLocales } from '@/utils/shared';
import dayjs from './dayjs';

const i18n = createI18n({
  legacy: false,
  fallbackLocale: 'en',
});

export function setI18nLanguage(locale) {
  i18n.global.locale.value = locale;

  document.querySelector('html').setAttribute('lang', locale);
}

export async function loadLocaleMessages(locale, location) {
  const isLocaleSupported = supportLocales.some(({ id }) => id === locale);

  if (!isLocaleSupported) {
    console.error(`${locale} locale is not supported`);

    return null;
  }

  const importLocale = async (path, merge = false) => {
    try {
      const messages = await import(
        /* webpackChunkName: "locales/locale-[request]" */ `../locales/${locale}/${path}`
      );

      if (merge) {
        i18n.global.mergeLocaleMessage(locale, messages.default);
      } else {
        i18n.global.setLocaleMessage(locale, messages.default);
      }
    } catch (error) {
      console.error(error);
    }
  };

  if (locale !== 'en' && !i18n.global.availableLocales.includes('en')) {
    await loadLocaleMessages('en', location);
  }

  dayjs.locale(locale);

  await importLocale('common.json');
  await importLocale(`${location}.json`, true);
  await importLocale('blocks.json', true);

  return nextTick();
}

export default i18n;
