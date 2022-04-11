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
      <slot name="prepend:selector" />
      <ui-select
        v-if="!hideSelector"
        :model-value="data.findBy || 'cssSelector'"
        :placeholder="t('workflow.blocks.base.findElement.placeholder')"
        class="w-full mb-2"
        @change="updateData({ findBy: $event })"
      >
        <option v-for="type in selectorTypes" :key="type" :value="type">
          {{ t(`workflow.blocks.base.findElement.options.${type}`) }}
        </option>
      </ui-select>
      <ui-autocomplete
        v-if="!hideSelector"
        :items="autocomplete"
        :trigger-char="['{{', '}}']"
        block
        hide-empty
        class="mb-1"
      >
        <ui-input
          v-if="!hideSelector"
          :model-value="data.selector"
          :placeholder="t('workflow.blocks.base.selector')"
          autocomplete="off"
          class="w-full"
          @change="updateData({ selector: $event })"
        />
      </ui-autocomplete>
      <ui-expand
        v-if="!hideSelector"
        hide-header-icon
        header-class="flex items-center w-full focus:ring-0"
      >
        <template #header="{ show }">
          <v-remixicon
            name="riArrowLeftSLine"
            :rotate="show ? 270 : 180"
            class="mr-1 transition-transform -ml-1"
          />
          Selector options
        </template>
        <div
          v-if="(data.findBy || 'cssSelector') === 'cssSelector'"
          class="mt-1"
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
        </div>
        <ui-checkbox
          :model-value="data.waitForSelector"
          block
          class="mt-1"
          @change="updateData({ waitForSelector: $event })"
        >
          {{ t('workflow.blocks.base.waitSelector.title') }}
        </ui-checkbox>
        <ui-input
          v-if="data.waitForSelector"
          :model-value="data.waitSelectorTimeout"
          :label="t('workflow.blocks.base.waitSelector.timeout')"
          class="mt-1 w-full"
          @change="updateData({ waitSelectorTimeout: +$event })"
        />
      </ui-expand>
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
  autocomplete: {
    type: Array,
    default: () => [],
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
