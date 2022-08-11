<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      autoresize
      :placeholder="t('common.description')"
      class="w-full mb-1"
      @change="updateData({ description: $event })"
    />
    <ui-input
      v-if="!data.everyNewTab"
      :model-value="data.timeout"
      :label="t('workflow.blocks.javascript-code.timeout.placeholder')"
      :title="t('workflow.blocks.javascript-code.timeout.title')"
      type="number"
      class="mb-2 w-full"
      @change="updateData({ timeout: +$event })"
    />
    <p class="text-sm ml-1 text-gray-600 dark:text-gray-200">
      {{ t('workflow.blocks.javascript-code.name') }}
    </p>
    <pre
      v-if="!state.showCodeModal"
      class="rounded-lg overflow-auto text-gray-200 p-4 max-h-80 bg-gray-900"
      @click="state.showCodeModal = true"
      v-text="data.code"
    />
    <ui-checkbox
      :model-value="data.everyNewTab"
      class="mt-2"
      @change="updateData({ everyNewTab: $event })"
    >
      {{ t('workflow.blocks.javascript-code.everyNewTab') }}
    </ui-checkbox>
    <ui-checkbox
      :model-value="data.runBeforeLoad"
      class="mt-2"
      @change="updateData({ runBeforeLoad: $event })"
    >
      Run before page loaded
    </ui-checkbox>
    <ui-modal v-model="state.showCodeModal" content-class="max-w-3xl">
      <template #header>
        <ui-tabs v-model="state.activeTab" class="border-none">
          <ui-tab value="code">
            {{ t('workflow.blocks.javascript-code.modal.tabs.code') }}
          </ui-tab>
          <ui-tab value="preloadScript">
            {{ t('workflow.blocks.javascript-code.modal.tabs.preloadScript') }}
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
            :style="{ height: data.everyNewTab ? '100%' : '87%' }"
            class="overflow-auto"
          />
          <template v-if="!data.everyNewTab">
            <p class="mt-1 text-sm flex justify-between">
              <span>{{
                t('workflow.blocks.javascript-code.availabeFuncs')
              }}</span>
              <span>
                <span
                  class="underline cursor-pointer select-none"
                  @click="modifyWhiteSpace"
                  >wrap line</span
                >
              </span>
            </p>
            <p
              class="space-x-1 whitespace-nowrap overflow-x-auto overflow-y-hidden pb-1 scroll"
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
          </template>
        </ui-tab-panel>
        <ui-tab-panel value="preloadScript">
          <div
            v-for="(script, index) in state.preloadScripts"
            :key="index"
            class="flex items-center mt-4"
          >
            <v-remixicon
              name="riDeleteBin7Line"
              class="mr-2 cursor-pointer"
              @click="state.preloadScripts.splice(index, 1)"
            />
            <ui-input
              v-model="state.preloadScripts[index].src"
              placeholder="http://example.com/script.js"
              class="flex-1 mr-4"
            />
            <ui-checkbox
              v-if="!data.everyNewTab"
              v-model="state.preloadScripts[index].removeAfterExec"
            >
              {{ t('workflow.blocks.javascript-code.removeAfterExec') }}
            </ui-checkbox>
          </div>
          <ui-button variant="accent" class="w-20 mt-4" @click="addScript">
            {{ t('common.add') }}
          </ui-button>
        </ui-tab-panel>
      </ui-tab-panels>
    </ui-modal>
  </div>
</template>
<script setup>
import { watch, reactive, defineAsyncComponent } from 'vue';
import { useI18n } from 'vue-i18n';
import { autocompletion } from '@codemirror/autocomplete';
import {
  automaFuncsSnippets,
  automaFuncsCompletion,
  completeFromGlobalScope,
} from '@/utils/codeEditorAutocomplete';
import { store } from '../../settings/jsBlockWrap';

function modifyWhiteSpace() {
  if (store.whiteSpace === 'pre') {
    store.whiteSpace = 'pre-wrap';
  } else {
    store.whiteSpace = 'pre';
  }
}

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const availableFuncs = [
  { name: 'automaNextBlock(data, insert?)', id: 'automanextblock-data' },
  { name: 'automaRefData(keyword, path?)', id: 'automarefdata-keyword-path' },
  {
    name: 'automaSetVariable(name, value)',
    id: 'automasetvariable-name-value',
  },
  { name: 'automaResetTimeout()', id: 'automaresettimeout' },
];
const autocompleteList = Object.values(automaFuncsSnippets).slice(0, 4);

const state = reactive({
  activeTab: 'code',
  code: `${props.data.code}`,
  preloadScripts: [...Object.values(props.data.preloadScripts || [])],
  showCodeModal: false,
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addScript() {
  state.preloadScripts.push({ src: '', removeAfterExec: true });
}

const codemirrorExts = [
  autocompletion({
    override: [
      automaFuncsCompletion(autocompleteList),
      completeFromGlobalScope,
    ],
  }),
];

watch(
  () => state.code,
  (value) => {
    updateData({ code: value });
  }
);
watch(
  () => state.preloadScripts,
  (value) => {
    updateData({ preloadScripts: value });
  },
  { deep: true }
);
</script>
<style scoped>
code {
  @apply bg-gray-900 text-sm text-white p-1 rounded-md;
}
</style>
