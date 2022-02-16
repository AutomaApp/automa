<template>
  <div class="mb-8">
    <p class="font-semibold mb-1">{{ t('settings.theme') }}</p>
    <ui-select
      :model-value="theme.activeTheme.value"
      class="w-80"
      @change="theme.set($event)"
    >
      <option v-for="item in theme.themes" :key="item.id" :value="item.id">
        {{ item.name }}
      </option>
    </ui-select>
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
</template>
<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useTheme } from '@/composable/theme';
import { supportLocales } from '@/utils/shared';

const { t } = useI18n();
const store = useStore();
const theme = useTheme();

const isLangChange = ref(false);
const settings = computed(() => store.state.settings);

async function updateLanguage(value) {
  isLangChange.value = true;

  store.dispatch('updateSettings', { locale: value });
}
</script>
