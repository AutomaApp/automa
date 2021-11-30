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
      v-if="!showCodeModal"
      :model-value="data.code"
      :highlight="highlighter('javascript')"
      readonly
      class="p-4 max-h-80"
      @click="showCodeModal = true"
    />
    <ui-modal
      v-model="showCodeModal"
      :title="t('workflow.blocks.javascript-code.modal')"
      content-class="max-w-3xl"
    >
      <prism-editor
        v-model="code"
        class="py-4"
        :highlight="highlighter('javascript')"
        line-numbers
        style="height: calc(100vh - 12rem)"
      />
      <p class="mt-1">
        {{ t('workflow.blocks.javascript-code.availabeFuns') }}
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
    </ui-modal>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { PrismEditor } from 'vue-prism-editor';
import { useI18n } from 'vue-i18n';
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

const code = ref(props.data.code);
const showCodeModal = ref(false);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

watch(code, (value) => {
  updateData({ code: value });
});
</script>
<style scoped>
code {
  @apply bg-gray-900 text-sm text-white p-1 rounded-md;
}
</style>
