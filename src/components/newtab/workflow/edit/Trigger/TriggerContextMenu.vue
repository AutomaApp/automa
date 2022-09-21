<template>
  <div>
    <template v-if="!permission.has[permissionName]">
      <p>
        {{ t('workflow.blocks.trigger.contextMenus.noPermission') }}
      </p>
      <ui-button class="mt-2" @click="permission.request(true)">
        {{ t('workflow.blocks.trigger.contextMenus.grantPermission') }}
      </ui-button>
    </template>
    <template v-else-if="workflow.data">
      <ui-input
        :label="t('workflow.blocks.trigger.contextMenus.contextName')"
        :placeholder="workflow.data.value.name"
        :model-value="data.contextMenuName"
        class="w-full"
        @change="$emit('update', { contextMenuName: $event })"
      />
      <ui-popover
        :options="{ animation: null }"
        trigger-width
        class="w-full mt-2"
        trigger-class="w-full"
      >
        <template #trigger>
          <span class="text-sm ml-1 text-gray-600 dark:text-gray-200">
            {{ t('workflow.blocks.trigger.contextMenus.appearIn') }}
          </span>
          <ui-button class="w-full">
            <p class="text-left flex-1 text-overflow mr-2">
              {{ data.contextTypes.join(', ') || 'All' }}
            </p>
            <v-remixicon
              size="28"
              name="riArrowDropDownLine"
              class="text-gray-600 dark:text-gray-200 -mr-2"
            />
          </ui-button>
        </template>
        <div class="grid gap-2 grid-cols-2">
          <ui-checkbox
            v-for="type in types"
            :key="type"
            :model-value="data.contextTypes?.includes(type)"
            @change="onSelectContextType($event, type)"
          >
            <span class="capitalize">{{ type }}</span>
          </ui-checkbox>
        </div>
      </ui-popover>
    </template>
  </div>
</template>
<script setup>
import { onMounted, inject } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHasPermissions } from '@/composable/hasPermissions';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const types = [
  'audio',
  'editable',
  'image',
  'link',
  'page',
  'password',
  'selection',
  'video',
];
const permissionName = BROWSER_TYPE === 'firefox' ? 'menus' : 'contextMenus';

const { t } = useI18n();
const permission = useHasPermissions([permissionName]);

const workflow = inject('workflow', {});

function onSelectContextType(selected, type) {
  const contextTypes = [...props.data.contextTypes];

  if (selected) {
    contextTypes.push(type);
  } else {
    const index = contextTypes.indexOf(type);
    contextTypes.splice(index, 1);
  }

  emit('update', { contextTypes });
}

onMounted(() => {
  if (props.data.contextMenuName.trim() || !workflow?.data) return;

  emit('update', { contextMenuName: workflow.data.value.name });
});
</script>
