<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <p
      v-if="browserType !== 'chrome'"
      class="text-sm leading-tight text-red-400 dark:text-red-300 mt-4"
    >
      {{ t('log.messages.browser-not-supported', { browser: browserType }) }}
    </p>
    <template v-else>
      <ui-checkbox
        :model-value="data.accept"
        block
        class="mt-4"
        @change="updateData({ accept: $event })"
      >
        {{ t('workflow.blocks.handle-dialog.accept') }}
      </ui-checkbox>
      <edit-autocomplete v-if="data.accept" class="mt-1">
        <ui-input
          :model-value="data.promptText"
          :label="t('workflow.blocks.handle-dialog.promptText.label')"
          :title="t('workflow.blocks.handle-dialog.promptText.description')"
          autocomplete="off"
          placeholder="Text"
          class="w-full"
          @change="updateData({ promptText: $event })"
        />
      </edit-autocomplete>
    </template>
  </div>
</template>
<script setup>
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
const browserType = BROWSER_TYPE;

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
