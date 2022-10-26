<template>
  <div class="space-y-2">
    <ui-textarea
      :model-value="data.description"
      :placeholder="t('common.description')"
      autoresize
      class="w-full"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.windowType"
      class="w-full"
      @change="updateData({ windowType: $event })"
    >
      <option value="main-window">
        {{ t('workflow.blocks.switch-to.windowTypes.main') }}
      </option>
      <option value="iframe">
        {{ t('workflow.blocks.switch-to.windowTypes.iframe') }}
      </option>
    </ui-select>
    <edit-autocomplete
      v-if="data.windowType === 'iframe'"
      :trigger-char="['{{', '}}']"
      block
      hide-empty
      class="mt-2"
      trigger-class="!flex items-end"
    >
      <ui-input
        :model-value="data.selector"
        :label="t('workflow.blocks.switch-to.iframeSelector')"
        placeholder="CSS Selector or XPath"
        autocomplete="off"
        class="w-full mr-2"
        @change="updateData({ selector: $event })"
      />
      <shared-el-selector-actions
        :selector="data.selector"
        @update:selector="updateData({ selector: $event })"
      />
    </edit-autocomplete>
  </div>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import SharedElSelectorActions from '@/components/newtab/shared/SharedElSelectorActions.vue';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
