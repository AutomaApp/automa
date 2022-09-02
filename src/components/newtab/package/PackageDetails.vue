<template>
  <div class="w-full max-w-2xl mt-8">
    <ui-input
      :model-value="data.name"
      label="Package name"
      class="w-full"
      placeholder="My package"
      @change="updatePackage({ name: $event })"
    />
    <label class="mt-4 block w-full">
      <span class="text-sm ml-1 text-gray-600 dark:text-gray-200">
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
      class="prose prose-zinc dark:prose-invert mt-4 max-w-none content-editor p-4 bg-box-transparent rounded-lg relative"
      @change="updatePackage({ content: $event })"
      @count="state.contentLength = $event"
    >
      <template #append>
        <p
          class="text-sm text-gray-600 dark:text-gray-200 absolute bottom-2 right-2"
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
