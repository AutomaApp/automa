import { supportLocales } from '@/utils/shared';
import { nextTick } from 'vue';
import { createI18n } from 'vue-i18n';
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

  const files = import.meta.glob('../locales/*/*.json', { eager: true });
  const importLocale = async (path, merge = false) => {
    try {
      const key = `../locales/${locale}/${path}`;
      const messages = files[key];
      if (!messages) throw new Error(`Missing locale file: ${key}`);
      const data = (messages && messages.default) || messages;
      if (merge) {
        i18n.global.mergeLocaleMessage(locale, data);
      } else {
        i18n.global.setLocaleMessage(locale, data);
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
  await importLocale('popup.json', true);
  await importLocale(`${location}.json`, true);
  await importLocale('blocks.json', true);

  return nextTick();
}

export default i18n;
