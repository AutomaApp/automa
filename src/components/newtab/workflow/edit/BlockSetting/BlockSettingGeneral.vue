<template>
  <div class="block-setting-general">
    <ui-list>
      <ui-list-item v-if="browserType !== 'firefox'" small>
        <ui-switch v-model="state.debugMode" class="mr-4" />
        <div class="flex-1 overflow-hidden">
          <p class="text-overflow">
            {{ t('workflow.settings.debugMode.title') }}
          </p>
          <p class="text-overflow">
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

const browserType = BROWSER_TYPE;

const { t } = useI18n();
const state = reactive({});

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
