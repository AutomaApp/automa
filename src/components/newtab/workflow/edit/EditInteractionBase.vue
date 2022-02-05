<template>
  <div>
    <slot name="prepend" />
    <template v-if="!hide">
      <ui-textarea
        :model-value="data.description"
        :placeholder="t('common.description')"
        class="w-full mb-2"
        @change="updateData({ description: $event })"
      />
      <ui-select
        :model-value="data.findBy || 'cssSelector'"
        :placeholder="t('workflow.blocks.base.findElement.placeholder')"
        class="w-full mb-2"
        @change="updateData({ findBy: $event })"
      >
        <option v-for="type in selectorTypes" :key="type" :value="type">
          {{ t(`workflow.blocks.base.findElement.options.${type}`) }}
        </option>
      </ui-select>
      <ui-input
        v-if="!hideSelector"
        :model-value="data.selector"
        :placeholder="t('workflow.blocks.base.selector')"
        class="mb-1 w-full"
        @change="updateData({ selector: $event })"
      />
      <template
        v-if="!hideSelector && (data.findBy || 'cssSelector') === 'cssSelector'"
      >
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
    </template>
    <slot></slot>
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
  hide: {
    type: Boolean,
    default: false,
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

const selectorTypes = ['cssSelector', 'xpath'];

function updateData(value) {
  const payload = { ...props.data, ...value };

  emit('update:data', payload);
  emit('change', payload);
}

onMounted(() => {
  if (!props.data.findBy) {
    updateData({ findBy: 'cssSelector' });
  }
});
</script>
