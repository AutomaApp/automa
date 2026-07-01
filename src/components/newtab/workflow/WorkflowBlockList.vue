<template>
  <ui-expand
    hide-header-icon
    header-class="flex items-center py-2 focus:ring-0 w-full text-left text-gray-600 dark:text-gray-200"
  >
    <template #header="{ show }">
      <span :class="category.color" class="h-3 w-3 rounded-full"></span>
      <p class="ml-2 flex-1 capitalize">
        {{ category.name }}
      </p>
      <v-remixicon :name="show ? 'riSubtractLine' : 'riAddLine'" size="20" />
    </template>
    <div class="mb-4 grid grid-cols-2 gap-2">
      <div
        v-for="block in blocks"
        :key="block.id"
        :title="getBlockTitle(block)"
        draggable="true"
        class="bg-input group relative cursor-move select-none rounded-lg p-4 transition"
        @dragstart="$event.dataTransfer.setData('block', JSON.stringify(block))"
      >
        <div
          class="invisible absolute right-2 top-2 flex items-center text-gray-600 group-hover:visible dark:text-gray-300"
        >
          <a
            :href="`https://docs.extension.automa.site/blocks/${block.id}.html`"
            :title="t('common.docs')"
            target="_blank"
            rel="noopener"
          >
            <v-remixicon name="riInformationLine" size="18" />
          </a>
          <span
            :title="`${pinned.includes(block.id) ? 'Unpin' : 'Pin'} block`"
            class="ml-1 cursor-pointer"
            @click="$emit('pin', block)"
          >
            <v-remixicon
              size="18"
              :name="
                pinned.includes(block.id) ? 'riPushpin2Fill' : 'riPushpin2Line'
              "
            />
          </span>
        </div>
        <img
          v-if="block.icon.startsWith('http')"
          :src="block.icon"
          alt=""
          width="24"
          class="mb-2 dark:invert"
        />
        <v-remixicon
          v-else
          :path="getIconPath(block.icon)"
          :name="block.icon"
          size="24"
          class="mb-2"
        />
        <p class="text-overflow capitalize leading-tight">
          {{ block.name }}
        </p>
        <div
          v-if="block.tag"
          class="flex items-center justify-center absolute top-0 right-0 min-w-[52px] h-[22px] group-hover:invisible rounded-tr-lg rounded-bl-[22px] rounded-tl-0 rounded-br-0 bg-[#79FFEB] dark:bg-[#2DD4BF] text-sm font-semibold dark:text-gray-900"
        >
          {{ block.tag }}
        </div>
      </div>
    </div>
  </ui-expand>
</template>
<script setup>
import { getBlocks } from '@/utils/getSharedData';
import { useI18n } from 'vue-i18n';

defineProps({
  category: {
    type: Object,
    default: () => ({}),
  },
  blocks: {
    type: Array,
    default: () => [],
  },
  pinned: {
    type: Array,
    default: () => [],
  },
});
defineEmits(['pin']);

const { t, te } = useI18n();
const blocksDetail = getBlocks();

function getBlockTitle({ description, id, name }) {
  const blockPath = `workflow.blocks.${id}`;
  if (!te(blockPath)) return blocksDetail[id].name;

  const descPath = `${blockPath}.${description ? 'description' : 'name'}`;
  let blockDescription = te(descPath) ? t(descPath) : name;

  if (description) {
    blockDescription = `[${t(`${blockPath}.name`)}]\n${blockDescription}`;
  }

  return blockDescription;
}
function getIconPath(path) {
  if (path && path.startsWith('path')) {
    const { 1: iconPath } = path.split(':');
    return iconPath;
  }

  return '';
}
</script>
