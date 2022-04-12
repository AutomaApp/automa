<template>
  <div class="mb-12">
    <p class="font-semibold mb-1">{{ t('settings.theme') }}</p>
    <div class="flex items-center space-x-4">
      <div
        v-for="item in theme.themes"
        :key="item.id"
        class="cursor-pointer"
        role="button"
        @click="theme.set(item.id)"
      >
        <div
          :class="{ 'ring ring-accent': item.id === theme.activeTheme.value }"
          class="p-0.5 rounded-lg"
        >
          <img
            :src="require(`@/assets/images/theme-${item.id}.png`).default"
            width="140"
            class="rounded-lg"
          />
        </div>
        <span class="text-sm text-gray-600 dark:text-gray-200 ml-1">
          {{ item.name }}
        </span>
      </div>
    </div>
  </div>
  <div class="flex items-center">
    <div id="languages">
      <p class="font-semibold mb-1">{{ t('settings.language.label') }}</p>
      <ui-select
        :model-value="settings.locale"
        class="w-80"
        @change="updateLanguage"
      >
        <option
          v-for="locale in supportLocales"
          :key="locale.id"
          :value="locale.id"
        >
          {{ locale.name }}
        </option>
      </ui-select>
      <a
        class="block text-gray-600 dark:text-gray-200 ml-1"
        href="https://github.com/Kholid060/automa/wiki/Help-Translate"
        target="_blank"
        rel="noopener"
      >
        {{ t('settings.language.helpTranslate') }}
      </a>
    </div>
    <p v-if="isLangChange" class="inline-block ml-4">
      {{ t('settings.language.reloadPage') }}
    </p>
  </div>
  <div class="mt-12 max-w-2xl">
    <p class="font-semibold">
      {{ t('settings.editor.curvature.title') }}
    </p>
    <div class="flex space-x-2 items-end">
      <ui-input
        v-for="item in curvatureSettings"
        :key="item.id"
        :model-value="settings.editor[item.key]"
        :label="t(`settings.editor.curvature.${item.id}`)"
        type="number"
        min="0"
        max="1"
        class="w-full"
        placeholder="0.5"
        @change="updateSetting(`editor.${item.key}`, curvatureLimit($event))"
      />
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';
import { useTheme } from '@/composable/theme';
import { supportLocales } from '@/utils/shared';

const curvatureSettings = [
  { id: 'line', key: 'curvature' },
  { id: 'reroute', key: 'reroute_curvature' },
  { id: 'rerouteFirstLast', key: 'reroute_curvature_start_end' },
];

const { t } = useI18n();
const store = useStore();
const theme = useTheme();

const isLangChange = ref(false);
const settings = computed(() => store.state.settings);

function curvatureLimit(value) {
  if (value > 1) return 1;
  if (value < 0) return 0;

  return value;
}
function updateSetting(path, value) {
  store.commit('updateStateNested', {
    value,
    path: `settings.${path}`,
  });

  browser.storage.local.set({ settings: settings.value });
}
function updateLanguage(value) {
  isLangChange.value = true;

  updateSetting('locale', value);
}
</script>
