<template>
  <div>
    <slot name="prepend" />
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      autoresize
      class="w-full mb-2"
      @change="updateData({ description: $event })"
    />
    <ui-input
      v-if="!hideSelector"
      :model-value="data.selector"
      :placeholder="t('workflow.blocks.base.selector')"
      class="mb-1 w-full"
      @change="updateData({ selector: $event })"
    />
    <template v-if="!hideSelector">
      <ui-checkbox
        v-if="!data.disableMultiple && !hideMultiple"
        :title="t('workflow.blocks.base.multiple.title')"
        :model-value="data.multiple"
        class="mr-6"
        @change="updateData({ multiple: $event })"
      >
        {{ t('workflow.blocks.base.multiple.text') }}
      </ui-checkbox>
      <ui-checkbox
        :model-value="data.markEl"
        :title="t('workflow.blocks.base.markElement.title')"
        @change="updateData({ markEl: $event })"
      >
        {{ t('workflow.blocks.base.markElement.text') }}
      </ui-checkbox>
    </template>
    <slot></slot>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  hideSelector: {
    type: Boolean,
    default: false,
  },
  hideMultiple: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:data', 'change']);

const { t } = useI18n();

function updateData(value) {
  const payload = { ...props.data, ...value };

  emit('update:data', payload);
  emit('change', payload);
}
</script>
