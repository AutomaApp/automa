<template>
  <div class="block-setting-general">
    <ui-list>
      <div v-if="props.data.id !== 'delay'" class="flex items-center">
        <div class="flex-1 overflow-hidden">
          <p class="text-overflow">
            {{ t('workflow.blocks.base.settings.blockTimeout.title') }}
          </p>
          <p class="line-clamp leading-tight text-gray-600 dark:text-gray-300">
            {{ t('workflow.blocks.base.settings.blockTimeout.description') }}
          </p>
        </div>
        <ui-input
          v-model.number="state.blockTimeout"
          placeholder="0"
          class="w-24"
        />
      </div>
      <ui-list-item v-if="isDebugSupported" small class="mt-4">
        <div class="flex-1 overflow-hidden">
          <p class="text-overflow">
            {{ t('workflow.blocks.debugMode.title') }}
          </p>
          <p
            class="text-overflow leading-tight text-gray-600 dark:text-gray-300"
          >
            {{ t('workflow.blocks.debugMode.description') }}
          </p>
        </div>
        <ui-switch v-model="state.debugMode" class="mr-4" />
      </ui-list-item>
    </ui-list>
  </div>
</template>
<script setup>
import { reactive, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  block: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['change']);

const supportedDebugBlocks = [
  'forms',
  'event-click',
  'trigger-event',
  'press-key',
];
const browserType = BROWSER_TYPE;
const isDebugSupported =
  browserType !== 'firefox' && supportedDebugBlocks.includes(props.block.id);

const { t } = useI18n();
const state = reactive({ blockTimeout: 0 });

watch(
  () => state,
  (onError) => {
    emit('change', onError);
  },
  { deep: true }
);

onMounted(() => {
  Object.assign(state, props.data);
});
</script>
