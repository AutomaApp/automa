<template>
  <ui-modal :title="t('workflowPermissions.title')" persist>
    <p class="font-semibold">
      {{ t('workflowPermissions.description') }}
    </p>
    <ui-list class="mt-2 space-y-1">
      <ui-list-item
        v-for="permission in permissions"
        :key="permission"
        small
        style="align-items: flex-start"
      >
        <v-remixicon :name="icons[permission]" class="mt-1" />
        <div class="ml-4 flex-1 overflow-hidden">
          <p class="leading-tight">
            {{ t(`workflowPermissions.${permission}.title`) }}
          </p>
          <p class="text-gray-600 dark:text-gray-200 leading-tight">
            {{ t(`workflowPermissions.${permission}.description`) }}
          </p>
        </div>
      </ui-list-item>
    </ui-list>
    <div class="text-right mt-8">
      <ui-button class="mr-2" @click="emit('update:modelValue', false)">
        {{ t('common.cancel') }}
      </ui-button>
      <ui-button variant="accent" @click="requestPermission">
        {{ t('workflow.blocks.clipboard.grantPermission') }}
      </ui-button>
    </div>
  </ui-modal>
</template>
<script setup>
import { toRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import browser from 'webextension-polyfill';

const props = defineProps({
  permissions: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();

const icons = {
  downloads: 'riDownloadLine',
  cliboards: 'riClipboardLine',
  contextMenus: 'riFileListLine',
  notifications: 'riNotification3Line',
};

function requestPermission() {
  console.log(props.permissions);
  browser.permissions
    .request({ permissions: toRaw(props.permissions) })
    .then(() => {
      emit('update:modelValue', false);
    });
}
</script>
