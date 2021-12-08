<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      autoresize
      :placeholder="t('common.description')"
      class="w-full mb-2"
      @change="updateData({ description: $event })"
    />
    <ui-input
      type="number"
      :model-value="data.timeout"
      class="mb-2 w-full"
      :placeholder="t('workflow.blocks.javascript-code.timeout.placeholder')"
      :title="t('workflow.blocks.javascript-code.timeout.title')"
      @change="updateData({ timeout: +$event })"
    />
    <prism-editor
      v-if="!state.showCodeModal"
      :model-value="data.code"
      :highlight="highlighter('javascript')"
      readonly
      class="p-4 max-h-80"
      @click="state.showCodeModal = true"
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
          <prism-editor
            v-model="state.code"
            :highlight="highlighter('javascript')"
            line-numbers
            class="py-4 overflow-auto"
            style="height: 87%"
          />
          <p class="mt-1">
            {{ t('workflow.blocks.javascript-code.availabeFuncs') }}
          </p>
          <p class="space-x-1">
            <a
              v-for="func in availableFuncs"
              :key="func.id"
              :href="`https://github.com/Kholid060/automa/wiki/Blocks#${func.id}`"
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
import { watch, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { PrismEditor } from 'vue-prism-editor';
import { highlighter } from '@/lib/prism';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const availableFuncs = [
  { name: 'automaNextBlock(data)', id: 'automanextblockdata' },
  { name: 'automaRefData(keyword, path)', id: 'automarefdatakeyword-path' },
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
