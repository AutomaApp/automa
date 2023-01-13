<template>
  <div class="w-full max-w-2xl pb-8">
    <ui-input
      :model-value="data.name"
      label="Package name"
      class="w-full"
      placeholder="My package"
      @change="updatePackage({ name: $event })"
    />
    <label class="mt-4 block w-full">
      <span class="ml-1 text-sm text-gray-600 dark:text-gray-200">
        Short description
      </span>
      <ui-textarea
        :model-value="data.description"
        placeholder="Short description"
        @change="updatePackage({ description: $event })"
      />
    </label>
    <shared-wysiwyg
      :model-value="data.content"
      :placeholder="$t('common.description')"
      :limit="5000"
      class="content-editor bg-box-transparent prose prose-zinc relative mt-4 max-w-none rounded-lg p-4 dark:prose-invert"
      @change="updatePackage({ content: $event })"
      @count="state.contentLength = $event"
    >
      <template #append>
        <p
          class="absolute bottom-2 right-2 text-sm text-gray-600 dark:text-gray-200"
        >
          {{ state.contentLength }}/5000
        </p>
      </template>
    </shared-wysiwyg>
  </div>
</template>
<script setup>
import { reactive } from 'vue';
import { debounce } from '@/utils/helper';
import SharedWysiwyg from '@/components/newtab/shared/SharedWysiwyg.vue';

defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const state = reactive({
  contentLength: 0,
});

const updatePackage = debounce((data) => {
  emit('update', data);
}, 400);
</script>
