<template>
  <div class="mb-2 mt-4">
    <ui-input
      :model-value="data.url"
      class="mb-3 w-full"
      placeholder="https://example.com/postreceive"
      required
      title="The Post receive URL"
      type="url"
      @change="updateData({ url: $event })"
    />
    <ui-select
      :model-value="data.contentType"
      placeholder="Select a content type"
      class="mb-3 w-full"
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
      class="mb-3 w-full"
      placeholder="Timeout"
      title="Http request execution timeout(ms)"
      type="number"
      @change="updateData({ timeout: +$event })"
    />
    <button
      class="mb-2 block w-full text-left focus:ring-0"
      @click="showOptionsRef = !showOptionsRef"
    >
      <v-remixicon
        name="riArrowLeftSLine"
        class="mr-1 transition-transform align-middle inline-block -ml-1"
        :rotate="showOptionsRef ? 270 : 180"
      />
      <span class="align-middle">Options Headers</span>
    </button>
    <transition-expand>
      <div v-if="showOptionsRef" class="my-2 border-2 border-dashed p-2">
        <div class="grid grid-cols-7 justify-items-center gap-2">
          <span class="col-span-3 font-bold">KEY</span>
          <span class="col-span-3 font-bold">VALUE</span>
          <div class=""></div>
          <template v-for="(items, index) in headerRef" :key="index">
            <ui-input v-model="items.name" type="text" class="col-span-3" />
            <ui-input v-model="items.value" type="text" class="col-span-3" />
            <button class="focus:ring-0" @click="removeHeader(index)">
              <v-remixicon name="riCloseCircleLine" size="20" />
            </button>
          </template>
          <button
            class="col-span-7 mt-2 block w-full text-center focus:ring-0"
            @click="addHeader"
          >
            <span
              ><v-remixicon
                class="align-middle inline-block"
                name="riAddLine"
                size="20"
            /></span>
            <span class="align-middle">Add Header</span>
          </button>
        </div>
      </div>
    </transition-expand>

    <prism-editor
      v-if="!showContentModalRef"
      :highlight="highlighter('json')"
      :model-value="data.content"
      class="p-4 max-h-80 mb-3"
      readonly
      @click="showContentModalRef = true"
    />
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
        <ul class="list-disc pl-5">
          <li>
            You can using <code>{%var[.index]%}</code> to dynamically calcute,
            driven by
            <a
              href="https://github.com/janl/mustache.js"
              class="border-b-2 border-red-300"
              target="_blank"
              >mustaches</a
            >
          </li>
          <li>
            Supported variables:
            <ul class="list-disc space-y-2 mt-2 text-sm pl-5">
              <li>column: Array[string]</li>
              <template
                v-for="column in workflow.data.value.dataColumns"
                :key="column.name"
              >
                <li>{{ column.name }}: Array[{{ column.type }}]</li>
              </template>
            </ul>
          </li>
        </ul>
      </div>
    </ui-modal>
  </div>
</template>
<script setup>
import { inject, ref, watch } from 'vue';
import { PrismEditor } from 'vue-prism-editor';
import { highlighter } from '@/lib/prism';
import { contentTypes } from '@/utils/shared';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const workflow = inject('workflow');
const emit = defineEmits(['update:data']);

const showOptionsRef = ref(false);
const contentRef = ref(props.data.content);
const headerRef = ref(props.data.headers);
const showContentModalRef = ref(false);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

watch(contentRef, (value) => {
  updateData({ content: value });
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
