<template>
  <div class="mb-4">
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <ui-input
      :model-value="data.timeout"
      :label="t('workflow.blocks.base.timeout')"
      placeholder="10000"
      type="number"
      class="mt-1 w-full"
      @change="updateData({ timeout: +$event })"
    />
    <ui-checkbox
      :model-value="data.specificFlow"
      class="mt-4"
      @change="updateData({ specificFlow: $event })"
    >
      {{ t('workflow.blocks.wait-connections.specificFlow') }}
    </ui-checkbox>
    <ui-select
      v-if="data.specificFlow"
      :model-value="data.flowBlockId"
      :label="t('workflow.blocks.wait-connections.selectFlow')"
      class="mt-1 w-full"
      @change="updateData({ flowBlockId: $event })"
    >
      <option v-for="item in connections" :key="item.id" :value="item.id">
        {{ item.name }}
      </option>
    </ui-select>
  </div>
</template>
<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  connections: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

onMounted(() => {
  if (props.data.flowBlockId) return;

  updateData({
    flowBlockId: props.connections[0]?.id || '',
  });
});
</script>
