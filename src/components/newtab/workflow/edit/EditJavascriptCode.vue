<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      autoresize
      placeholder="Description"
      class="w-full mb-2"
      @change="updateData({ description: $event })"
    />
    <ui-input
      type="number"
      :model-value="data.timeout"
      class="mb-2 w-full"
      placeholder="Timeout"
      title="Javascript code execution timeout"
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
      title="Javascript code"
      content-class="max-w-3xl"
    >
      <prism-editor
        v-model="code"
        class="py-4"
        :highlight="highlighter('javascript')"
        line-numbers
        style="height: calc(100vh - 18rem)"
      />
      <div>
        Note:
        <ul class="list-disc pl-5">
          <li>
            To execute the next block, you can call the
            <code>automaNextBlock</code> function. This function accepts one
            parameter, which you can use to save data to the workflow. Data
            format:
            <ul class="list-disc space-y-2 mt-2 text-sm pl-5">
              <li><code>{ key: value }</code></li>
              <li>
                <code>[{ key: value }, { key: value }]</code>
              </li>
            </ul>
            You must use the column that you added as a key.
          </li>
          <li>
            To reset the execution timeout of the code, you can call the
            <code>automaResetTimeout</code> function.
          </li>
        </ul>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { PrismEditor } from 'vue-prism-editor';
import { highlighter } from '@/lib/prism';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

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
