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
      <p
        class="leading-tight cursor-pointer"
        :class="descriptionCollapsed ? 'line-clamp' : 'whitespace-pre-wrap'"
        @click="descriptionCollapsed = !descriptionCollapsed"
      >
        <!-- description here -->
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
    class="px-4 mt-4 mb-2"
  />
  <div class="scroll bg-scroll px-4 flex-1 relative overflow-auto">
    <ui-expand
      v-for="(items, catId) in blocks"
      :key="catId"
      v-model="expandList[catId]"
      hide-header-icon
      header-class="flex items-center py-2 focus:ring-0 w-full text-left text-gray-600 dark:text-gray-200"
    >
      <template #header="{ show }">
        <span
          :class="categories[catId].color"
          class="h-3 w-3 rounded-full"
        ></span>
        <p class="capitalize flex-1 ml-2">
          {{ categories[catId].name }}
        </p>
        <v-remixicon :name="show ? 'riSubtractLine' : 'riAddLine'" size="20" />
      </template>
      <div class="grid grid-cols-2 gap-2 mb-4">
        <div
          v-for="block in items"
          :key="block.id"
          :title="getBlockTitle(block)"
          draggable="true"
          class="transform select-none cursor-move relative p-4 rounded-lg bg-input transition group"
          @dragstart="
            $event.dataTransfer.setData('block', JSON.stringify(block))
          "
        >
          <a
            :href="`https://docs.automa.site/blocks/${block.id}.html`"
            :title="t('common.docs')"
            target="_blank"
            rel="noopener"
            class="absolute top-px right-2 top-2 text-gray-600 dark:text-gray-300 invisible group-hover:visible"
          >
            <v-remixicon name="riInformationLine" size="18" />
          </a>
          <v-remixicon :name="block.icon" size="24" class="mb-2" />
          <p class="leading-tight text-overflow capitalize">
            {{ block.name }}
          </p>
        </div>
      </div>
    </ui-expand>
  </div>
</template>
<script setup>
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useShortcut } from '@/composable/shortcut';
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
const shortcut = useShortcut('action:search', () => {
  const searchInput = document.querySelector('#search-input input');

  searchInput?.focus();
});

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
const categoriesExpand = Object.keys(categories).reduce((acc, key) => {
  acc[key] = true;

  return acc;
}, {});

const descriptionCollapsed = ref(true);

const query = ref('');
const expandList = ref(categoriesExpand);

const blocks = computed(() =>
  blocksArr.reduce((arr, block) => {
    if (
      block.name.toLocaleLowerCase().includes(query.value.toLocaleLowerCase())
    ) {
      expandList.value[block.category] = true;
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
function getBlockTitle({ description, id }) {
  const blockPath = `workflow.blocks.${id}`;
  let blockDescription = t(
    `${blockPath}.${description ? 'description' : 'name'}`
  );

  if (description) {
    blockDescription = `[${t(`${blockPath}.name`)}]\n${blockDescription}`;
  }

  return blockDescription;
}
</script>
