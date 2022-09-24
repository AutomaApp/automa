<template>
  <ul class="space-y-2">
    <li v-for="option in types" :key="option" class="group">
      <ui-checkbox
        :model-value="modelValue[option]"
        @change="
          $emit('update:modelValue', { ...modelValue, [option]: $event })
        "
      >
        {{ t(`workflow.blocks.trigger.element-change.${option}.title`) }}
        <v-remixicon
          :title="
            t(`workflow.blocks.trigger.element-change.${option}.description`)
          "
          class="info-icon invisible group-hover:visible"
          size="18"
          name="riInformationLine"
        />
      </ui-checkbox>
      <template v-if="option === 'attributes' && modelValue.attributes">
        <ui-input
          :model-value="modelValue.attributeFilter.join(',')"
          :label="
            t('workflow.blocks.trigger.element-change.subtree.description')
          "
          class="w-full block"
          placeholder="id,label,class"
          @change="onAttrFilterChange"
        >
          <template #label>
            {{
              t('workflow.blocks.trigger.element-change.attributeFilter.title')
            }}
            <v-remixicon
              :title="
                t(
                  'workflow.blocks.trigger.element-change.attributeFilter.description'
                )
              "
              class="info-icon"
              size="18"
              name="riInformationLine"
            />
          </template>
        </ui-input>
        <span class="text-sm text-gray-600 dark:text-gray-200">
          {{
            t('workflow.blocks.trigger.element-change.attributeFilter.separate')
          }}
        </span>
      </template>
    </li>
  </ul>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { debounce } from '@/utils/helper';

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:modelValue']);

const types = ['subtree', 'childList', 'attributes', 'characterData'];
const { t } = useI18n();

const onAttrFilterChange = debounce((value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    attributeFilter: value.split(','),
  });
}, 200);
</script>
