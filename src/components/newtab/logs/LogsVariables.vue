<template>
  <div v-if="Object.keys(variables).length === 0" class="text-center">
    <img src="@/assets/svg/files-and-folder.svg" class="mx-auto max-w-sm" />
    <p class="text-xl font-semibold">{{ t('message.noData') }}</p>
  </div>
  <template v-else>
    <ui-tabs
      v-model="state.activeTab"
      type="fill"
      class="mb-4"
      color=""
      style="padding: 0"
    >
      <ui-tab value="gui"> GUI </ui-tab>
      <ui-tab value="raw"> Raw </ui-tab>
    </ui-tabs>
    <div v-if="state.activeTab === 'gui'" class="mt-4">
      <ul class="grid grid-cols-1 gap-4 space-y-2 md:grid-cols-2">
        <li
          v-for="(varValue, varName) in variables"
          :key="varName"
          class="flex items-center space-x-2 rounded-lg border-2 px-2 pb-2 pt-1"
        >
          <ui-input
            :model-value="varName"
            :label="t('common.name')"
            class="w-full"
            placeholder="EMPTY"
            readonly
          />
          <ui-input
            :model-value="JSON.stringify(varValue)"
            label="Value"
            class="w-full"
            placeholder="EMPTY"
            readonly
          />
        </li>
      </ul>
    </div>
    <shared-codemirror
      v-else
      :model-value="JSON.stringify(variables, null, 2)"
      class="mt-4"
      lang="json"
      readonly
    />
  </template>
</template>
<script setup>
import { defineAsyncComponent, shallowReactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  currentLog: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();
const state = shallowReactive({
  activeTab: 'gui',
});

const variables = computed(() => props.currentLog.data?.variables || {});
</script>
