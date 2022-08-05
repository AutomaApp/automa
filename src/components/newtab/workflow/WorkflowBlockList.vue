<template>
  <ui-expand
    hide-header-icon
    header-class="flex items-center py-2 focus:ring-0 w-full text-left text-gray-600 dark:text-gray-200"
  >
    <template #header="{ show }">
      <span :class="category.color" class="h-3 w-3 rounded-full"></span>
      <p class="capitalize flex-1 ml-2">
        {{ category.name }}
      </p>
      <v-remixicon :name="show ? 'riSubtractLine' : 'riAddLine'" size="20" />
    </template>
    <div class="grid grid-cols-2 gap-2 mb-4">
      <div
        v-for="block in blocks"
        :key="block.id"
        :title="getBlockTitle(block)"
        draggable="true"
        class="transform select-none cursor-move relative p-4 rounded-lg bg-input transition group"
        @dragstart="$event.dataTransfer.setData('block', JSON.stringify(block))"
      >
        <div
          class="flex items-center absolute right-2 invisible group-hover:visible top-2 text-gray-600 dark:text-gray-300"
        >
          <a
            :href="`https://docs.automa.site/blocks/${block.id}.html`"
            :title="t('common.docs')"
            target="_blank"
            rel="noopener"
          >
            <v-remixicon name="riInformationLine" size="18" />
          </a>
          <span
            :title="`${pinned.includes(block.id) ? 'Unpin' : 'Pin'} block`"
            class="cursor-pointer ml-1"
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
        <v-remixicon :name="block.icon" size="24" class="mb-2" />
        <p class="leading-tight text-overflow capitalize">
          {{ block.name }}
        </p>
      </div>
    </div>
  </ui-expand>
</template>
<script setup>
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

const { t } = useI18n();

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
