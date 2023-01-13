<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      autoresize
      :placeholder="t('common.description')"
      class="mb-1 w-full"
      @change="updateData({ description: $event })"
    />
    <template v-if="!data.everyNewTab">
      <ui-input
        :model-value="data.timeout"
        :label="t('workflow.blocks.javascript-code.timeout.placeholder')"
        :title="t('workflow.blocks.javascript-code.timeout.title')"
        type="number"
        class="mb-2 w-full"
        @change="updateData({ timeout: +$event })"
      />
      <ui-select
        v-if="
          !isFirefox &&
          (!workflow?.data?.value.settings?.execContext ||
            workflow?.data?.value.settings?.execContext === 'popup')
        "
        :model-value="data.context"
        :label="t('workflow.blocks.javascript-code.context.name')"
        class="mb-2 w-full"
        @change="updateData({ context: $event })"
      >
        <option
          v-for="item in ['website', 'background']"
          :key="item"
          :value="item"
        >
          {{ t(`workflow.blocks.javascript-code.context.items.${item}`) }}
        </option>
      </ui-select>
    </template>
    <p class="ml-1 text-sm text-gray-600 dark:text-gray-200">
      {{ t('workflow.blocks.javascript-code.name') }}
    </p>
    <pre
      v-if="!state.showCodeModal"
      class="max-h-80 overflow-auto rounded-lg bg-gray-900 p-4 text-gray-200"
      @click="state.showCodeModal = true"
      v-text="data.code"
    />
    <template v-if="isFirefox || data.context !== 'background'">
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
    </template>
    <ui-modal v-model="state.showCodeModal" content-class="max-w-4xl">
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
          </template>
        </ui-tab-panel>
        <ui-tab-panel value="preloadScript">
          <div
            v-for="(script, index) in state.preloadScripts"
            :key="index"
            class="mt-4 flex items-center"
          >
            <v-remixicon
              name="riDeleteBin7Line"
              class="mr-2 cursor-pointer"
              @click="state.preloadScripts.splice(index, 1)"
            />
            <ui-input
              v-model="state.preloadScripts[index].src"
              placeholder="http://example.com/script.js"
              class="mr-4 flex-1"
            />
            <ui-checkbox
              v-if="
                (!data.everyNewTab || data.context !== 'website') && !isFirefox
              "
              v-model="state.preloadScripts[index].removeAfterExec"
            >
              {{ t('workflow.blocks.javascript-code.removeAfterExec') }}
            </ui-checkbox>
          </div>
          <ui-button variant="accent" class="mt-4 w-20" @click="addScript">
            {{ t('common.add') }}
          </ui-button>
        </ui-tab-panel>
      </ui-tab-panels>
    </ui-modal>
  </div>
</template>
<script setup>
import { watch, reactive, defineAsyncComponent, inject } from 'vue';
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

const isFirefox = BROWSER_TYPE === 'firefox';
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

const workflow = inject('workflow');

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
