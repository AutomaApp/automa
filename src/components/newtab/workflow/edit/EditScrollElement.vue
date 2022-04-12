<template>
  <edit-interaction-base
    v-bind="{ data, autocomplete, hide: hideBase }"
    @change="updateData"
  >
    <div v-if="!data.scrollIntoView" class="flex items-center mt-3 space-x-2">
      <ui-input
        :model-value="data.scrollX || 0"
        :label="t('workflow.blocks.element-scroll.scrollX')"
        type="number"
        @change="updateData({ scrollX: +$event })"
      />
      <ui-input
        :model-value="data.scrollY || 0"
        :label="t('workflow.blocks.element-scroll.scrollY')"
        type="number"
        @change="updateData({ scrollY: +$event })"
      />
    </div>
    <div class="mt-3 space-y-2">
      <ui-checkbox
        class="w-full"
        :model-value="data.scrollIntoView"
        @change="updateData({ scrollIntoView: $event })"
      >
        {{ t('workflow.blocks.element-scroll.intoView') }}
      </ui-checkbox>
      <ui-checkbox
        :model-value="data.smooth"
        @change="updateData({ smooth: $event })"
      >
        {{ t('workflow.blocks.element-scroll.smooth') }}
      </ui-checkbox>
      <template v-if="!data.scrollIntoView">
        <ui-checkbox
          :model-value="data.incX"
          @change="updateData({ incX: $event })"
        >
          {{ t('workflow.blocks.element-scroll.incScrollX') }}
        </ui-checkbox>
        <ui-checkbox
          :model-value="data.incY"
          @change="updateData({ incY: $event })"
        >
          {{ t('workflow.blocks.element-scroll.incScrollY') }}
        </ui-checkbox>
      </template>
    </div>
  </edit-interaction-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import EditInteractionBase from './EditInteractionBase.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  hideBase: {
    type: Boolean,
    default: false,
  },
  autocomplete: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
</script>
