<template>
  <div class="block-setting-general">
    <ui-list>
      <div v-if="props.data.id !== 'delay'" class="flex items-center">
        <div class="flex-1 overflow-hidden">
          <p class="text-overflow">
            {{ t('workflow.blocks.base.settings.blockTimeout.title') }}
          </p>
          <p class="line-clamp leading-tight dark:text-gray-300 text-gray-600">
            {{ t('workflow.blocks.base.settings.blockTimeout.description') }}
          </p>
        </div>
        <ui-input
          v-model.number="state.blockTimeout"
          placeholder="0"
          class="w-24"
        />
      </div>
      <ui-list-item v-if="isDebugSupported" small>
        <ui-switch v-model="state.debugMode" class="mr-4" />
        <div class="flex-1 overflow-hidden">
          <p class="text-overflow">
            {{ t('workflow.settings.debugMode.title') }}
          </p>
          <p
            class="text-overflow leading-tight dark:text-gray-300 text-gray-600"
          >
            Execute block using the Chrome DevTools Protocol
          </p>
        </div>
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
  browserType !== 'firefox' && supportedDebugBlocks.includes(props.data.id);

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
