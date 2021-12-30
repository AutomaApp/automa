<template>
  <div class="px-4 flex items-start mb-2 mt-1">
    <ui-popover class="mr-2 h-8">
      <template #trigger>
        <span
          :title="t('workflow.sidebar.workflowIcon')"
          class="cursor-pointer inline-block h-full"
        >
          <ui-img
            v-if="workflow.icon.startsWith('http')"
            :src="workflow.icon"
            class="w-8 h-8"
          />
          <v-remixicon v-else :name="workflow.icon" size="26" class="mt-1" />
        </span>
      </template>
      <div class="w-56">
        <p class="mb-2">{{ t('workflow.sidebar.workflowIcon') }}</p>
        <div class="grid grid-cols-5 mb-2 gap-1">
          <span
            v-for="icon in icons"
            :key="icon"
            class="cursor-pointer rounded-lg inline-block text-center p-2 hoverable"
            @click="$emit('update', { icon })"
          >
            <v-remixicon :name="icon" />
          </span>
        </div>
        <ui-input
          :model-value="workflow.icon.startsWith('ri') ? '' : workflow.icon"
          type="url"
          placeholder="http://example.com/img.png"
          label="Icon URL"
          @change="updateWorkflowIcon"
        />
      </div>
    </ui-popover>
    <div class="flex-1 overflow-hidden">
      <p class="font-semibold mt-1 text-overflow text-lg leading-tight">
        {{ workflow.name }}
      </p>
      <p class="line-clamp leading-tight">
        {{ workflow.description }}
      </p>
    </div>
  </div>
  <ui-input
    v-model="query"
    :placeholder="`${t('common.search')}...`"
    prepend-icon="riSearch2Line"
    class="px-4 mt-4 mb-2"
  />
  <div class="scroll bg-scroll overflow-auto px-4 flex-1 overflow-auto">
    <template v-for="(items, catId) in blocks" :key="catId">
      <div class="flex items-center top-0 space-x-2 mb-2">
        <span
          :class="categories[catId].color"
          class="h-3 w-3 rounded-full"
        ></span>
        <p class="capitalize text-gray-600">{{ categories[catId].name }}</p>
      </div>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div
          v-for="block in items"
          :key="block.id"
          :title="
            t(
              `workflow.blocks.${block.id}.${
                block.description ? 'description' : 'name'
              }`
            )
          "
          draggable="true"
          class="transform select-none cursor-move relative p-4 rounded-lg bg-input transition"
          @dragstart="
            $event.dataTransfer.setData('block', JSON.stringify(block))
          "
        >
          <a
            v-if="block.docs"
            :href="`https://github.com/Kholid060/automa/wiki/Blocks#${block.id}`"
            target="_blank"
            :title="t('common.docs')"
            rel="noopener"
            class="absolute top-px right-2"
          >
            &#128712;
          </a>
          <v-remixicon :name="block.icon" size="24" class="mb-2" />
          <p class="leading-tight text-overflow">
            {{ block.name }}
          </p>
        </div>
      </div>
    </template>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { tasks, categories } from '@/utils/shared';

defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
  dataChanged: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();

const icons = [
  'riGlobalLine',
  'riFileTextLine',
  'riEqualizerLine',
  'riTimerLine',
  'riCalendarLine',
  'riFlashlightLine',
  'riLightbulbFlashLine',
  'riDatabase2Line',
  'riWindowLine',
  'riCursorLine',
  'riDownloadLine',
  'riCommandLine',
];

const blocksArr = Object.entries(tasks).map(([key, block]) => ({
  ...block,
  id: key,
  name: t(`workflow.blocks.${key}.name`),
}));

const query = ref('');
const blocks = computed(() =>
  blocksArr.reduce((arr, block) => {
    if (
      block.name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())
    ) {
      (arr[block.category] = arr[block.category] || []).push(block);
    }

    return arr;
  }, {})
);

function updateWorkflowIcon(value) {
  if (!value.startsWith('http')) return;

  const iconUrl = value.slice(0, 1024);

  emit('update', { icon: iconUrl });
}
</script>
