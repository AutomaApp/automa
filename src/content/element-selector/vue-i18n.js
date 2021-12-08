import { createI18n } from 'vue-i18n/dist/vue-i18n.esm-bundler';
import enCommon from '@/locales/en/common.json';
import enBlocks from '@/locales/en/blocks.json';

const i18n = createI18n({
  locale: 'en',
  legacy: false,
});

i18n.global.mergeLocaleMessage('en', enCommon);
i18n.global.mergeLocaleMessage('en', enBlocks);

export default i18n;
