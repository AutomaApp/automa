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
            class="overflow-auto"
            style="height: 87%"
          />
          <p class="mt-1">
            {{ t('workflow.blocks.javascript-code.availabeFuncs') }}
          </p>
          <p class="space-x-1">
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
            <ui-checkbox v-model="state.preloadScripts[index].removeAfterExec">
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
import { syntaxTree } from '@codemirror/language';
import { autocompletion, snippet } from '@codemirror/autocomplete';

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
  { name: 'automaNextBlock(data)', id: 'automanextblock-data' },
  { name: 'automaRefData(keyword, path)', id: 'automarefdata-keyword-path' },
  { name: 'automaResetTimeout', id: 'automaresettimeout' },
];

const state = reactive({
  activeTab: 'code',
  code: `${props.data.code}`,
  preloadScripts: [...(props.data.preloadScripts || [])],
  showCodeModal: false,
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function addScript() {
  state.preloadScripts.push({ src: '', removeAfterExec: true });
}
const dontCompleteIn = [
  'String',
  'TemplateString',
  'LineComment',
  'BlockComment',
  'VariableDefinition',
  'PropertyDefinition',
];
/* eslint-disable no-template-curly-in-string */
function automaFuncsCompletion(context) {
  const word = context.matchBefore(/\w*/);
  const nodeBefore = syntaxTree(context.state).resolveInner(context.pos, -1);

  if (
    (word.from === word.to && !context.explicit) ||
    dontCompleteIn.includes(nodeBefore.name)
  )
    return null;

  return {
    from: word.from,
    options: [
      {
        label: 'automaNextBlock',
        type: 'function',
        apply: snippet('automaNextBlock(${data})'),
        info: () => {
          const container = document.createElement('div');

          container.innerHTML = `
            <code>automaNextBlock(<i>data</i>)</code>
            <p class="mt-2">
              Execute the next block
              <a href="https://docs.automa.site/blocks/javascript-code.html#automanextblock-data" target="_blank" class="underline">
                Read more
              </a>
            </p>
          `;

          return container;
        },
      },
      {
        label: 'automaSetVariable',
        type: 'function',
        apply: snippet('automaSetVariable(${name}, ${value})'),
        info: () => {
          const container = document.createElement('div');

          container.innerHTML = `
            <code>automaRefData(<i>name</i>, <i>value</i>)</code>
            <p class="mt-2">
              Set the value of a variable
            </p>
          `;

          return container;
        },
      },
      {
        label: 'automaRefData',
        type: 'function',
        apply: snippet("automaRefData('${keyword}', '${path}')"),
        info: () => {
          const container = document.createElement('div');

          container.innerHTML = `
            <code>automaRefData(<i>keyword</i>, <i>path</i>)</code>
            <p class="mt-2">
              Use this function to
              <a href="https://docs.automa.site/api-reference/reference-data.html" target="_blank" class="underline">
                reference data
              </a>
            </p>
          `;

          return container;
        },
      },
      {
        label: 'automaResetTimeout',
        type: 'function',
        info: 'Reset javascript execution timeout',
        apply: 'automaResetTimeout()',
      },
    ],
  };
}

const codemirrorExts = [autocompletion({ override: [automaFuncsCompletion] })];

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
