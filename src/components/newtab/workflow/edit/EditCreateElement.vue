<template>
  <edit-interaction-base
    :data="blockData"
    hide-mark-el
    hide-multiple
    @change="updateSelector"
  >
    <ui-select
      v-model="blockData.insertAt"
      :label="$t('workflow.blocks.create-element.insertEl.title')"
      class="mt-4 w-full"
    >
      <option v-for="item in insertOptions" :key="item" :value="item">
        {{ $t(`workflow.blocks.create-element.insertEl.items.${item}`) }}
      </option>
    </ui-select>
    <ui-checkbox
      :model-value="data.runBeforeLoad"
      class="mt-2"
      @change="updateData({ runBeforeLoad: $event })"
    >
      Run before page loaded
    </ui-checkbox>
    <ui-button
      variant="accent"
      class="mt-4 w-full"
      @click="state.showModal = true"
    >
      {{ $t('workflow.blocks.create-element.edit') }}
    </ui-button>
    <ui-modal
      v-model="state.showModal"
      content-class="max-w-3xl create-element-modal"
      padding="p-0"
    >
      <template #header>
        <ui-tabs v-model="state.activeTab" class="space-x-1 border-none">
          <ui-tab v-for="tab in tabs" :key="tab.id" :value="tab.id">
            {{ tab.name }}
          </ui-tab>
          <ui-tab value="preloadScript">
            {{ $t('workflow.blocks.javascript-code.modal.tabs.preloadScript') }}
          </ui-tab>
        </ui-tabs>
      </template>
      <ui-tab-panels
        :model-value="state.activeTab"
        class="scroll mb-4 overflow-auto px-4"
        style="height: calc(100vh - 12rem)"
      >
        <ui-tab-panel value="html" class="h-full">
          <shared-codemirror
            v-model="blockData.html"
            lang="html"
            class="h-full"
          />
        </ui-tab-panel>
        <ui-tab-panel value="css" class="h-full">
          <shared-codemirror
            v-model="blockData.css"
            lang="css"
            class="h-full"
          />
        </ui-tab-panel>
        <ui-tab-panel value="javascript" class="h-full">
          <div class="mb-4">
            <span class="text-sm text-gray-500 dark:text-gray-300">
              Available functions
            </span>
            <div class="flex items-center space-x-2">
              <a
                v-for="func in availableFuncs"
                :key="func.id"
                :href="`https://docs.automa.site/blocks/javascript-code.html#${func.id}`"
                target="_blank"
                rel="noopener"
                class="bg-box-transparent inline-block rounded-md p-1 text-sm"
              >
                <code>
                  {{ func.name }}
                </code>
              </a>
            </div>
          </div>
          <shared-codemirror
            v-model="blockData.javascript"
            :extensions="codemirrorExts"
            lang="javascript"
            class="h-full"
          />
        </ui-tab-panel>
        <ui-tab-panel value="preloadScript">
          <ul class="my-1 space-y-2">
            <li
              v-for="(item, index) in blockData.preloadScripts"
              :key="index"
              class="flex items-center space-x-2"
            >
              <ui-select v-model="item.type" placeholder="Type">
                <option value="style">Style</option>
                <option value="script">Script</option>
              </ui-select>
              <ui-input
                v-model="item.src"
                :placeholder="`https://example.com/${
                  item.type === 'style' ? 'style.css' : 'script.js'
                }`"
                type="url"
                class="flex-1"
              />
              <v-remixicon
                name="riDeleteBin7Line"
                class="cursor-pointer"
                @click="blockData.preloadScripts.splice(index, 1)"
              />
            </li>
          </ul>
          <ui-button class="mt-4" @click="addPreloadScript">
            Add script
          </ui-button>
        </ui-tab-panel>
      </ui-tab-panels>
    </ui-modal>
  </edit-interaction-base>
</template>
<script setup>
import { reactive, watch, defineAsyncComponent } from 'vue';
import { autocompletion } from '@codemirror/autocomplete';
import cloneDeep from 'lodash.clonedeep';
import {
  automaFuncsSnippets,
  automaFuncsCompletion,
  completeFromGlobalScope,
} from '@/utils/codeEditorAutocomplete';
import EditInteractionBase from './EditInteractionBase.vue';

const SharedCodemirror = defineAsyncComponent(() =>
  import('@/components/newtab/shared/SharedCodemirror.vue')
);

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  blockId: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:data']);

const availableFuncs = [
  { name: 'automaRefData(keyword, path?)', id: 'automarefdata-keyword-path' },
  { name: 'automaExecWorkflow(options)', id: 'automaexecworkflow-options' },
];
const insertOptions = [
  'before',
  'after',
  'prev-sibling',
  'next-sibling',
  'replace',
];
const tabs = [
  { id: 'html', name: 'HTML' },
  { id: 'css', name: 'CSS' },
  { id: 'javascript', name: 'JavaScript' },
];

const autocompleteList = [
  automaFuncsSnippets.automaExecWorkflow,
  automaFuncsSnippets.automaRefData,
];
const codemirrorExts = [
  autocompletion({
    override: [
      automaFuncsCompletion(autocompleteList),
      completeFromGlobalScope,
    ],
  }),
];

const blockData = reactive(cloneDeep(props.data));
const state = reactive({
  showModal: false,
  activeTab: 'html',
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addPreloadScript() {
  blockData.preloadScripts.push({
    src: '',
    type: 'script',
  });
}
function updateSelector(data) {
  Object.assign(blockData, data);
}

watch(blockData, (newValue) => {
  updateData(newValue);
});
</script>
<style>
.create-element-modal .modal-ui__content-header {
  @apply p-4 mb-0;
}
</style>
