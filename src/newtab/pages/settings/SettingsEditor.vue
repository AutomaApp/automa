<template>
  <div class="max-w-2xl">
    <p class="font-semibold">Zoom</p>
    <div class="flex items-center mt-1 space-x-4">
      <ui-input
        v-model.number="settings.minZoom"
        type="number"
        label="Min zoom"
      />
      <ui-input
        v-model.number="settings.maxZoom"
        type="number"
        label="Max zoom"
      />
    </div>
    <ui-list class="mt-8 space-y-2">
      <ui-list-item small>
        <ui-switch v-model="settings.arrow" />
        <div class="flex-1 ml-4">
          <p class="leading-tight">
            {{ t('settings.editor.arrow.title') }}
          </p>
          <p class="text-gray-600 text-sm leading-tight dark:text-gray-200">
            {{ t('settings.editor.arrow.description') }}
          </p>
        </div>
      </ui-list-item>
      <ui-list-item small>
        <ui-switch v-model="settings.snapToGrid" />
        <div class="flex-1 ml-4">
          <p class="leading-tight">
            {{ t('settings.editor.snapGrid.title') }}
          </p>
          <p class="text-gray-600 text-sm leading-tight dark:text-gray-200">
            {{ t('settings.editor.snapGrid.description') }}
          </p>
        </div>
      </ui-list-item>
      <transition-expand>
        <div
          v-if="settings.snapToGrid"
          class="pl-16 ml-2 space-x-2"
          style="margin-top: 0"
        >
          <ui-input
            v-model.number="settings.snapGrid[0]"
            type="number"
            label="X Axis"
          />
          <ui-input
            v-model.number="settings.snapGrid[1]"
            type="number"
            label="Y Axis"
          />
        </div>
      </transition-expand>
    </ui-list>
  </div>
</template>
<script setup>
import { reactive, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import cloneDeep from 'lodash.clonedeep';
import { useStore } from '@/stores/main';

const { t } = useI18n();
const store = useStore();

const settings = reactive({});

watch(settings, () => {
  store.updateSettings({ editor: settings });
});

onMounted(() => {
  Object.assign(settings, cloneDeep(store.settings.editor));
});
</script>
