<template>
  <div class="container pt-8 pb-4">
    <h1 class="text-2xl font-semibold mb-10">{{ t('common.settings') }}</h1>
    <div class="flex items-center">
      <div id="languages">
        <ui-select
          :model-value="settings.locale"
          :label="t('settings.language.label')"
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
          class="block text-sm text-gray-600 dark:text-gray-200 ml-1"
          target="_blank"
        >
          {{ t('settings.language.helpTranslate') }}
        </a>
      </div>
      <p v-if="isLangChange" class="inline-block ml-4">
        {{ t('settings.language.reloadPage') }}
      </p>
    </div>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { supportLocales } from '@/utils/shared';

const { t } = useI18n();
const store = useStore();

const isLangChange = ref(false);
const settings = computed(() => store.state.settings);

async function updateLanguage(value) {
  isLangChange.value = true;

  store.dispatch('updateSettings', { locale: value });
}
</script>
