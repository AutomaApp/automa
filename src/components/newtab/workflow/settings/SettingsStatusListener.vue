<template>
  <div class="flex items-center">
    <div class="mr-4">
      <p>{{ t('workflow.settings.statusListener.title') }}</p>
      <p class="text-sm leading-tight text-gray-600 dark:text-gray-200">
        {{ t('workflow.settings.statusListener.description') }}
      </p>
    </div>
    <pre
      v-if="!state.showCodeModal"
      class="max-h-40 overflow-auto rounded-lg bg-gray-900 p-4 text-gray-200"
      @click="state.showCodeModal = true"
      v-text="settings.statusListenerCallbackCode"
    />
    <ui-modal v-model="state.showCodeModal" content-class="max-w-4xl">
      <template #header>
        <ui-tabs v-model="state.activeTab" class="border-none">
          <ui-tab value="code">
            {{ t('workflow.blocks.javascript-code.modal.tabs.code') }}
          </ui-tab>
        </ui-tabs>
      </template>
      <ui-tab-panels
        v-model="state.activeTab"
        class="overflow-auto"
        style="height: calc(100vh - 9rem)"
      >
        <ui-tab-panel value="code" class="h-full">
          <shared-codemirror
            v-model="state.code"
            :extensions="codemirrorExts"
            :style="{ height: '87%' }"
            class="overflow-auto"
          />
          <p class="mt-1 flex justify-between text-sm">
            <span>{{
              t('workflow.blocks.javascript-code.availabeFuncs')
            }}</span>
            <span>
              <span
                class="cursor-pointer select-none underline"
                @click="modifyWhiteSpace"
                >wrap line</span
              >
            </span>
          </p>
          <p
            class="scroll space-x-1 overflow-x-auto overflow-y-hidden whitespace-nowrap pb-1"
          >
            <a
              v-for="func in availableFuncs"
              :key="func.id"
              :href="`https://docs.automa.site/blocks/javascript-code.html#${func.id}`"
              target="_blank"
              rel="noopener"
              class="inline-block"
            >
              <code>
                {{ func.name }}
              </code>
            </a>
          </p>
        </ui-tab-panel>
      </ui-tab-panels>
    </ui-modal>
  </div>
</template>
<script setup>
import { reactive, defineAsyncComponent, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { autocompletion } from '@codemirror/autocomplete';
import {
  automaFuncsSnippets,
  automaFuncsCompletion,
  completeFromGlobalScope,
} from '@/utils/codeEditorAutocomplete';

const props = defineProps({
  settings: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);
const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const { t } = useI18n();

const state = reactive({
  activeTab: 'code',
  code: `${props.settings.statusListenerCallbackCode}`,
  showCodeModal: false,
});

const availableFuncs = [
  { name: 'automaNextBlock(data, insert?)', id: 'automanextblock-data' },
  { name: 'automaRefData(keyword, path?)', id: 'automarefdata-keyword-path' },
  {
    name: 'automaSetVariable(name, value)',
    id: 'automasetvariable-name-value',
  },
  {
    name: 'automaFetch(type, resource)',
    id: 'automasetvariable-type-resource',
  },
  { name: 'automaResetTimeout()', id: 'automaresettimeout' },
];
const autocompleteList = Object.values(automaFuncsSnippets).slice(0, 4);

const codemirrorExts = [
  autocompletion({
    override: [
      automaFuncsCompletion(autocompleteList),
      completeFromGlobalScope,
    ],
  }),
];

function updateSetting(key, value) {
  emit('update', { key, value });
}

watch(
  () => state.code,
  (value) => {
    updateSetting('statusListenerCallbackCode', value);
  }
);
</script>

<style scoped>
pre {
  min-width: 200px;
  min-height: 50px;
}
code {
  @apply bg-gray-900 text-sm text-white p-1 rounded-md;
}
</style>
