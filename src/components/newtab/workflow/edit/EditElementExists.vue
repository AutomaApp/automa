<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.findBy || 'cssSelector'"
      :placeholder="t('workflow.blocks.base.findElement.placeholder')"
      class="w-full mb-1 mt-4"
      @change="updateData({ findBy: $event })"
    >
      <option v-for="type in selectorTypes" :key="type" :value="type">
        {{ t(`workflow.blocks.base.findElement.options.${type}`) }}
      </option>
    </ui-select>
    <edit-autocomplete class="mb-1">
      <ui-input
        :model-value="data.selector"
        :label="t('workflow.blocks.element-exists.selector')"
        :placeholder="data.findBy === 'xpath' ? '//element' : '.element'"
        autocomplete="off"
        class="w-full"
        @change="updateData({ selector: $event })"
      />
    </edit-autocomplete>
    <ui-input
      :model-value="data.tryCount"
      :title="t('workflow.blocks.element-exists.tryFor.title')"
      :label="t('workflow.blocks.element-exists.tryFor.label')"
      class="w-full mb-1"
      type="number"
      min="1"
      @change="updateData({ tryCount: +$event })"
    />
    <ui-input
      :model-value="data.timeout"
      :label="t('workflow.blocks.element-exists.timeout.label')"
      :title="t('workflow.blocks.element-exists.timeout.title')"
      class="w-full"
      type="number"
      min="200"
      @change="updateData({ timeout: +$event })"
    />
    <label class="flex items-center mt-4">
      <ui-switch
        :model-value="data.throwError"
        class="mr-2"
        @change="updateData({ throwError: $event })"
      />
      <span>{{ t('workflow.blocks.element-exists.throwError') }}</span>
    </label>
  </div>
</template>
<script setup>
import { onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const selectorTypes = ['cssSelector', 'xpath'];

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

onMounted(() => {
  if (!props.data.findBy) {
    updateData({ findBy: 'cssSelector' });
  }
});
</script>
