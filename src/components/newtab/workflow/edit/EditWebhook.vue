<template>
  <div class="mb-2 mt-4">
    <ui-textarea
      :model-value="data.description"
      placeholder="Description"
      class="w-full mb-2"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.url"
      class="mb-2 w-full"
      placeholder="https://example.com/postreceive"
      required
      title="The Post receive URL"
      type="url"
      @change="updateData({ url: $event })"
    />
    <ui-select
      :model-value="data.contentType"
      placeholder="Select a content type"
      class="mb-2 w-full"
      @change="updateData({ contentType: $event })"
    >
      <option
        v-for="type in contentTypes"
        :key="type.value"
        :value="type.value"
      >
        {{ type.name }}
      </option>
    </ui-select>
    <ui-input
      :model-value="data.timeout"
      class="mb-2 w-full"
      placeholder="Timeout"
      title="Http request execution timeout(ms)"
      type="number"
      @change="updateData({ timeout: +$event })"
    />
    <ui-tabs v-model="activeTab" fill class="mb-4">
      <ui-tab value="headers">Headers</ui-tab>
      <ui-tab value="body">Content body</ui-tab>
    </ui-tabs>
    <ui-tab-panels :model-value="activeTab">
      <ui-tab-panel
        value="headers"
        class="grid grid-cols-7 justify-items-center gap-2"
      >
        <template v-for="(items, index) in headerRef" :key="index">
          <ui-input
            v-model="items.name"
            :placeholder="`Header ${index + 1}`"
            type="text"
            class="col-span-3"
          />
          <ui-input
            v-model="items.value"
            placeholder="Value"
            type="text"
            class="col-span-3"
          />
          <button @click="removeHeader(index)">
            <v-remixicon name="riCloseCircleLine" size="20" />
          </button>
        </template>
        <ui-button
          class="col-span-4 mt-4 block w-full"
          variant="accent"
          @click="addHeader"
        >
          <span> Add Header </span>
        </ui-button>
      </ui-tab-panel>
      <ui-tab-panel value="body">
        <prism-editor
          v-if="!showContentModalRef"
          :highlight="highlighter('json')"
          :model-value="data.body"
          class="p-4 max-h-80 mb-2"
          readonly
          @click="showContentModalRef = true"
        />
      </ui-tab-panel>
    </ui-tab-panels>
    <ui-modal
      v-model="showContentModalRef"
      content-class="max-w-3xl"
      title="Content Body"
    >
      <prism-editor
        v-model="contentRef"
        :highlight="highlighter('json')"
        class="py-4"
        line-numbers
        style="height: calc(100vh - 18rem)"
      />
      <div class="mt-3">
        <a
          href="https://github.com/Kholid060/automa/wiki/Features#reference-data"
          rel="noopener"
          class="border-b text-primary"
          target="_blank"
        >
          Click here to learn how to add dynamic data
        </a>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { ref, watch } from 'vue';
import { PrismEditor } from 'vue-prism-editor';
import { highlighter } from '@/lib/prism';
import { contentTypes } from '@/utils/shared';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const activeTab = ref('headers');
const contentRef = ref(props.data.body);
const headerRef = ref(props.data.headers);
const showContentModalRef = ref(false);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

watch(contentRef, (value) => {
  updateData({ body: value });
});

function removeHeader(index) {
  headerRef.value.splice(index, 1);
}

function addHeader() {
  headerRef.value.push({ name: '', value: '' });
}

watch(
  headerRef,
  (value) => {
    updateData({ headers: value });
  },
  { deep: true }
);
</script>
<style scoped>
code {
  @apply bg-gray-900 text-sm text-white p-1 rounded-md;
}
</style>
