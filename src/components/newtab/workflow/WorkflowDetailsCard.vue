<template>
  <div class="mb-2 mt-1 flex items-start px-4">
    <ui-popover class="mr-2 h-8">
      <template #trigger>
        <span
          :title="t('workflow.sidebar.workflowIcon')"
          class="inline-block h-full cursor-pointer"
        >
          <ui-img
            v-if="workflow.icon.startsWith('http')"
            :src="workflow.icon"
            class="h-8 w-8"
          />
          <v-remixicon v-else :name="workflow.icon" size="26" class="mt-1" />
        </span>
      </template>
      <div class="w-56">
        <p class="mb-2">{{ t('workflow.sidebar.workflowIcon') }}</p>
        <div class="mb-2 grid grid-cols-5 gap-1">
          <span
            v-for="icon in icons"
            :key="icon"
            class="hoverable inline-block cursor-pointer rounded-lg p-2 text-center"
            @click="$emit('update', { icon })"
          >
            <v-remixicon :name="icon" />
          </span>
        </div>
        <ui-input
          :model-value="workflow.icon.startsWith('http') ? workflow.icon : ''"
          type="url"
          placeholder="http://example.com/img.png"
          label="Icon URL"
          @change="updateWorkflowIcon"
        />
      </div>
    </ui-popover>
    <div class="flex-1 overflow-hidden">
      <p class="text-overflow mt-1 text-lg font-semibold leading-tight">
        {{ workflow.name }}
      </p>
      <p
        class="cursor-pointer leading-tight"
        :class="descriptionCollapsed ? 'line-clamp' : 'whitespace-pre-wrap'"
        @click="descriptionCollapsed = !descriptionCollapsed"
      >
        {{ workflow.description }}
      </p>
    </div>
  </div>
  <ui-input
    id="search-input"
    v-model="query"
    :placeholder="`${t('common.search')}... (${
      shortcut['action:search'].readable
    })`"
    prepend-icon="riSearch2Line"
    class="mt-4 mb-2 w-full px-4"
  />
  <div class="scroll relative flex-1 overflow-auto bg-scroll px-4">
    <workflow-block-list
      v-if="pinnedBlocksList.length > 0"
      :model-value="true"
      :blocks="pinnedBlocksList"
      :category="pinnedCategory"
      :pinned="pinnedBlocks"
      @pin="pinBlock"
    />
    <workflow-block-list
      v-for="(items, catId) in blocks"
      :key="catId"
      :model-value="true"
      :blocks="items"
      :category="categories[catId]"
      :pinned="pinnedBlocks"
      @pin="pinBlock"
    />
  </div>
</template>
<script setup>
import { computed, ref, onMounted, watch, toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';
import { useShortcut } from '@/composable/shortcut';
import { categories } from '@/utils/shared';
import { getBlocks } from '@/utils/getSharedData';
import WorkflowBlockList from './WorkflowBlockList.vue';

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

const { t, te } = useI18n();
const shortcut = useShortcut('action:search', () => {
  const searchInput = document.querySelector('#search-input input');

  searchInput?.focus();
});

const pinnedCategory = {
  name: 'Pinned blocks',
  color: 'bg-accent',
};
const icons = [
  'mdiPackageVariantClosed',
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

const copyBlocks = getBlocks();
delete copyBlocks['block-package'];

const blocksArr = Object.entries(copyBlocks).map(([key, block]) => {
  const localeKey = `workflow.blocks.${key}.name`;

  return {
    ...block,
    id: key,
    name: te(localeKey) ? t(localeKey) : block.name,
  };
});

const descriptionCollapsed = ref(true);

const query = ref('');
const pinnedBlocks = ref([]);

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
const pinnedBlocksList = computed(() =>
  pinnedBlocks.value
    .map((id) => {
      const namePath = `workflow.blocks.${id}.name`;

      return {
        ...copyBlocks[id],
        id,
        name: te(namePath) ? t(namePath) : copyBlocks[id].name,
      };
    })
    .filter(({ name }) =>
      name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())
    )
);

function updateWorkflowIcon(value) {
  if (!value.startsWith('http')) return;

  const iconUrl = value.slice(0, 1024);

  emit('update', { icon: iconUrl });
}
function pinBlock({ id }) {
  const index = pinnedBlocks.value.indexOf(id);

  if (index !== -1) pinnedBlocks.value.splice(index, 1);
  else pinnedBlocks.value.push(id);
}

watch(
  pinnedBlocks,
  () => {
    browser.storage.local.set({
      pinnedBlocks: toRaw(pinnedBlocks.value),
    });
  },
  { deep: true }
);

onMounted(() => {
  browser.storage.local.get('pinnedBlocks').then((item) => {
    pinnedBlocks.value = item.pinnedBlocks || [];
  });
});
</script>
