<template>
  <ui-card padding="p-1">
    <button
      v-for="item in modalActions"
      :key="item.id"
      v-tooltip.group="item.name"
      class="hoverable p-2 rounded-lg"
      @click="$emit('showModal', item.id)"
    >
      <v-remixicon :name="item.icon" />
    </button>
  </ui-card>
  <ui-card padding="p-1 ml-4">
    <button
      v-if="!workflow.isDisabled"
      v-tooltip.group="t('common.execute')"
      icon
      class="hoverable p-2 rounded-lg"
      @click="$emit('execute')"
    >
      <v-remixicon name="riPlayLine" />
    </button>
    <button
      v-else
      v-tooltip="t('workflow.clickToEnable')"
      class="p-2"
      @click="$emit('update', { isDisabled: false })"
    >
      {{ t('common.disabled') }}
    </button>
  </ui-card>
  <ui-card padding="p-1 ml-4 space-x-1">
    <ui-popover>
      <template #trigger>
        <button class="rounded-lg p-2 hoverable">
          <v-remixicon name="riMore2Line" />
        </button>
      </template>
      <ui-list class="w-36">
        <ui-list-item
          class="cursor-pointer"
          @click="$emit('update', { isDisabled: !workflow.isDisabled })"
        >
          <v-remixicon name="riToggleLine" class="mr-2 -ml-1" />
          {{ t(`common.${workflow.isDisabled ? 'enable' : 'disable'}`) }}
        </ui-list-item>
        <ui-list-item
          v-for="item in moreActions"
          :key="item.id"
          v-close-popover
          class="cursor-pointer"
          @click="$emit(item.id)"
        >
          <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
          {{ item.name }}
        </ui-list-item>
      </ui-list>
    </ui-popover>
    <ui-button variant="accent" class="relative" @click="$emit('save')">
      <span
        v-if="isDataChanged"
        class="flex h-3 w-3 absolute top-0 left-0 -ml-1 -mt-1"
      >
        <span
          class="
            animate-ping
            absolute
            inline-flex
            h-full
            w-full
            rounded-full
            bg-primary
            opacity-75
          "
        ></span>
        <span
          class="relative inline-flex rounded-full h-3 w-3 bg-blue-600"
        ></span>
      </span>
      <v-remixicon name="riSaveLine" class="mr-2 -ml-1 my-1" />
      {{ t('common.save') }}
    </ui-button>
  </ui-card>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { useGroupTooltip } from '@/composable/groupTooltip';

defineProps({
  isDataChanged: {
    type: Boolean,
    default: false,
  },
  workflow: {
    type: Object,
    default: () => ({}),
  },
});
defineEmits([
  'showModal',
  'execute',
  'rename',
  'delete',
  'save',
  'export',
  'update',
]);

useGroupTooltip();
const { t } = useI18n();

const modalActions = [
  {
    id: 'data-columns',
    name: t('workflow.dataColumns.title'),
    icon: 'riKey2Line',
  },
  {
    id: 'global-data',
    name: t('common.globalData'),
    icon: 'riDatabase2Line',
  },
  {
    id: 'settings',
    name: t('common.settings'),
    icon: 'riSettings3Line',
  },
];
const moreActions = [
  {
    id: 'export',
    name: t('common.export'),
    icon: 'riDownloadLine',
  },
  {
    id: 'rename',
    name: t('common.rename'),
    icon: 'riPencilLine',
  },
  {
    id: 'delete',
    name: t('common.delete'),
    icon: 'riDeleteBin7Line',
  },
  {
    id: 'setIcon',
    name: 'Set icon',
    icon: 'riImageLine',
  },
];
</script>
