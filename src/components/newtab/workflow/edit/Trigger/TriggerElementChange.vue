<template>
  <div>
    <ui-input
      v-model="observeDetail.matchPattern"
      :label="t('workflow.blocks.trigger.element-change.target')"
      class="w-full"
      placeholder="https://web.telegram.org/*"
    >
      <template #label>
        {{ t('workflow.blocks.switch-tab.matchPattern') }}
        <a
          :title="t('workflow.blocks.trigger.element-change.targetWebsite')"
          href="https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Match_patterns#examples"
          target="_blank"
          rel="noopener"
          class="inline-block"
        >
          <v-remixicon name="riInformationLine" class="info-icon" size="18" />
        </a>
      </template>
    </ui-input>
    <ui-input
      v-model="observeDetail.baseSelector"
      class="w-full mt-4"
      placeholder="CSS Selector or XPath"
    >
      <template #label>
        <span>
          {{ t('workflow.blocks.trigger.element-change.baseEl.title') }}
        </span>
        <v-remixicon
          :title="
            t('workflow.blocks.trigger.element-change.baseEl.description')
          "
          name="riInformationLine"
          class="info-icon"
          size="18"
        />
      </template>
    </ui-input>
    <ui-expand header-class="w-full group flex items-center focus:ring-0">
      <template #header>
        {{ t('common.options') }}
      </template>
      <trigger-element-options v-model="observeDetail.baseElOptions" />
    </ui-expand>
    <ui-input
      v-model="observeDetail.selector"
      :label="t('workflow.blocks.trigger.element-change.target')"
      class="w-full mt-4"
      placeholder="CSS Selector or XPath"
    />
    <ui-expand header-class="w-full flex items-center focus:ring-0 group">
      <template #header>
        {{ t('common.options') }}
        <v-remixicon
          :title="t('workflow.blocks.trigger.element-change.optionsInfo')"
          class="info-icon invisible group-hover:visible"
          size="18"
          name="riInformationLine"
        />
      </template>
      <trigger-element-options
        v-model="observeDetail.targetOptions"
        show-desc
      />
    </ui-expand>
  </div>
</template>
<script setup>
import { onMounted, reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import cloneDeep from 'lodash.clonedeep';
import TriggerElementOptions from './TriggerElementOptions.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();

const state = reactive({
  retrieved: false,
});
const observeDetail = reactive({
  selector: '',
  baseSelector: '',
  matchPattern: '',
  targetOptions: {
    subtree: false,
    childList: true,
    attributes: false,
    attributeFilter: [],
    characterData: false,
  },
  baseElOptions: {
    subtree: false,
    childList: true,
    attributes: false,
    attributeFilter: [],
    characterData: false,
  },
});

watch(
  observeDetail,
  (value) => {
    if (!state.retrieved) return;

    emit('update', { observeElement: value });
  },
  { deep: true }
);

onMounted(() => {
  Object.assign(observeDetail, cloneDeep(props.data.observeElement));
  setTimeout(() => {
    state.retrieved = true;
  }, 100);
});
</script>
<style>
.info-icon {
  @apply text-gray-600 dark:text-gray-300 inline-block;
}
</style>
