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
            :src="require(`@/assets/images/theme-${item.id}.png`)"
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
  <div id="delete-logs" class="mt-12">
    <p class="font-semibold mb-1">
      {{ t('settings.deleteLog.title') }}
    </p>
    <ui-select
      label="Delete after"
      class="w-80"
      :model-value="settings.deleteLogAfter"
      @change="
        updateSetting('deleteLogAfter', $event === 'never' ? 'never' : +$event)
      "
    >
      <option v-for="day in deleteLogDays" :key="day" :value="day">
        <template v-if="typeof day === 'string'">
          {{ t('settings.deleteLog.deleteAfter.never') }}
        </template>
        <template v-else>
          {{ t('settings.deleteLog.deleteAfter.days', { day }) }}
        </template>
      </option>
    </ui-select>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useStore } from '@/stores/main';
import { useTheme } from '@/composable/theme';
import { supportLocales } from '@/utils/shared';

const deleteLogDays = ['never', 7, 14, 30, 60, 120];

const { t } = useI18n();
const store = useStore();
const theme = useTheme();

const isLangChange = ref(false);
const settings = computed(() => store.settings);

function updateSetting(path, value) {
  store.updateSettings({ [path]: value });
}
function updateLanguage(value) {
  isLangChange.value = true;

  updateSetting('locale', value);
}
</script>
