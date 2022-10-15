<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <template v-if="hasAllPermissions">
      <ui-select
        :model-value="data.type"
        class="mt-4 w-full"
        @change="updateData({ type: $event })"
      >
        <option v-for="type in types" :key="type" :value="type">
          {{ t(`workflow.blocks.clipboard.types.${type}`) }}
        </option>
      </ui-select>
      <insert-workflow-data
        v-if="data.type === 'get'"
        :data="data"
        variables
        @update="updateData"
      />
      <template v-else>
        <ui-textarea
          v-if="!data.copySelectedText"
          :model-value="data.dataToCopy"
          placeholder="Text"
          class="mt-4"
          @change="updateData({ dataToCopy: $event })"
        />
        <ui-checkbox
          :model-value="data.copySelectedText"
          class="mt-2"
          @change="updateData({ copySelectedText: $event })"
        >
          {{ t('workflow.blocks.clipboard.copySelection') }}
        </ui-checkbox>
      </template>
    </template>
    <template v-else>
      <p class="mt-4">
        {{ t('workflow.blocks.clipboard.noPermission') }}
      </p>
      <ui-button variant="accent" class="mt-2" @click="permission.request">
        {{ t('workflow.blocks.clipboard.grantPermission') }}
      </ui-button>
    </template>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useHasPermissions } from '@/composable/hasPermissions';
import InsertWorkflowData from './InsertWorkflowData.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const types = ['get', 'insert'];
const permissions = ['clipboardRead'];
const isFirefox = BROWSER_TYPE === 'firefox';

if (isFirefox) {
  permissions.push('clipboardWrite');
}

const { t } = useI18n();
const permission = useHasPermissions(permissions);

const hasAllPermissions = computed(() => {
  if (isFirefox)
    return permission.has.clipboardRead && permission.has.clipboardWrite;

  return permission.has.clipboardRead;
});

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
