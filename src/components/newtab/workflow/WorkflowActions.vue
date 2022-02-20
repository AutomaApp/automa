<template>
  <ui-card v-if="!workflow.isProtected" padding="p-1 flex items-center">
    <ui-popover>
      <template #trigger>
        <button
          v-tooltip.group="t('workflow.host.title')"
          class="hoverable p-2 rounded-lg"
        >
          <v-remixicon
            :class="{ 'text-primary': data.isHost }"
            name="riBaseStationLine"
          />
        </button>
      </template>
      <div :class="{ 'text-center': data.loadingHost }" class="w-64">
        <div class="flex items-center text-gray-600 dark:text-gray-200">
          <p>
            {{ t('workflow.host.set') }}
          </p>
          <a
            :title="t('common.docs')"
            href="https://docs.automa.site/guide/host-workflow.html"
            target="_blank"
            class="ml-1"
          >
            <v-remixicon name="riInformationLine" size="20" />
          </a>
          <div class="flex-grow"></div>
          <template v-if="$store.state.user">
            <ui-spinner v-if="data.loadingHost" color="text-accent" />
            <ui-switch
              v-else
              :model-value="data.isHost"
              @change="$emit('host', $event)"
            />
          </template>
          <ui-switch v-else v-close-popover @click="$emit('host', 'auth')" />
        </div>
        <transition-expand>
          <ui-input
            v-if="data.isHost"
            v-tooltip:bottom="t('workflow.host.id')"
            :model-value="host.hostId"
            prepend-icon="riLinkM"
            readonly
            class="mt-4 block w-full"
            @click="$event.target.select()"
          />
        </transition-expand>
      </div>
    </ui-popover>
    <button
      v-tooltip.group="t('workflow.share.title')"
      :class="{ 'text-primary': data.hasShared }"
      class="hoverable p-2 rounded-lg"
      @click="$emit('share')"
    >
      <v-remixicon name="riShareLine" />
    </button>
  </ui-card>
  <ui-card padding="p-1 ml-4">
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
  <ui-card padding="p-1 ml-4 flex items-center">
    <button
      v-if="!workflow.isDisabled"
      v-tooltip.group="
        `${t('common.execute')} (${
          shortcuts['editor:execute-workflow'].readable
        })`
      "
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
    <ui-button
      :title="shortcuts['editor:save'].readable"
      variant="accent"
      class="relative"
      @click="$emit('save')"
    >
      <span
        v-if="isDataChanged"
        class="flex h-3 w-3 absolute top-0 left-0 -ml-1 -mt-1"
      >
        <span
          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
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
import { useShortcut, getShortcut } from '@/composable/shortcut';

defineProps({
  isDataChanged: {
    type: Boolean,
    default: false,
  },
  workflow: {
    type: Object,
    default: () => ({}),
  },
  host: {
    type: Object,
    default: () => ({}),
  },
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits([
  'showModal',
  'execute',
  'rename',
  'delete',
  'save',
  'export',
  'update',
  'share',
  'host',
]);

useGroupTooltip();

const { t } = useI18n();
const shortcuts = useShortcut(
  [
    getShortcut('editor:save', 'save'),
    getShortcut('editor:execute-workflow', 'execute'),
  ],
  ({ data }) => {
    emit(data);
  }
);

const modalActions = [
  {
    id: 'table',
    name: t('workflow.table.title'),
    icon: 'riTable2',
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
];
</script>
