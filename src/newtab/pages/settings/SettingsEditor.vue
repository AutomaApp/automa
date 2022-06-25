<template>
  <p>Hello world</p>
</template>
<!-- <template>
  <div class="max-w-2xl">
    <p class="font-semibold">
      {{ t('settings.editor.curvature.title') }}
    </p>
    <div class="flex items-center space-x-4 mt-2">
      <div
        v-for="item in curvatureOptions"
        :key="item.id"
        class="cursor-pointer"
        role="button"
        @click="updateSetting('disableCurvature', item.value)"
      >
        <div
          :class="{
            'ring ring-accent': item.value === settings.editor.disableCurvature,
          }"
          class="p-0.5 rounded-lg"
        >
          <img
            :src="require(`@/assets/images/${item.id}.png`)"
            width="140"
            class="rounded-lg"
          />
        </div>
        <span class="text-sm text-gray-600 dark:text-gray-200 ml-1">
          {{ t(`common.${item.name}`) }}
        </span>
      </div>
    </div>
    <transition-expand>
      <div
        v-if="!settings.editor.disableCurvature"
        class="flex space-x-2 items-end mt-1"
      >
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
          @change="updateSetting(item.key, curvatureLimit($event))"
        />
      </div>
    </transition-expand>
    <ui-list class="mt-8">
      <ui-list-item small>
        <ui-switch
          :model-value="settings.editor.arrow"
          @change="updateSetting('arrow', $event)"
        />
        <div class="flex-1 ml-4">
          <p class="leading-tight">
            {{ t('settings.editor.arrow.title') }}
          </p>
          <p class="text-gray-600 text-sm leading-tight dark:text-gray-200">
            {{ t('settings.editor.arrow.description') }}
          </p>
        </div>
      </ui-list-item>
    </ui-list>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';

const curvatureSettings = [
  { id: 'line', key: 'curvature' },
  { id: 'reroute', key: 'reroute_curvature' },
  { id: 'rerouteFirstLast', key: 'reroute_curvature_start_end' },
];
const curvatureOptions = [
  { id: 'curvature', value: false, name: 'enable' },
  { id: 'no-curvature', value: true, name: 'disable' },
];

const { t } = useI18n();
const store = useStore();

const settings = computed(() => store.state.settings);

function updateSetting(path, value) {
  store.commit('updateStateNested', {
    value,
    path: `settings.editor.${path}`,
  });

  browser.storage.local.set({ settings: settings.value });
}
function curvatureLimit(value) {
  if (value > 1) return 1;
  if (value < 0) return 0;

  return value;
}
</script>
 -->
