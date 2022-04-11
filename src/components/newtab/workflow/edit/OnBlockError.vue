<template>
  <div class="on-block-error">
    <ui-button @click="state.showModal = true">
      <v-remixicon name="riShieldLine" class="-ml-1 mr-2" />
      <span>
        {{ t('workflow.blocks.base.onError.button') }}
      </span>
    </ui-button>
    <ui-modal
      v-model="state.showModal"
      :title="t('workflow.blocks.base.onError.title')"
      content-class="max-w-xl"
    >
      <div
        class="p-4 rounded-lg bg-green-200 dark:bg-green-300 flex items-start text-black"
      >
        <v-remixicon name="riInformationLine" />
        <p class="flex-1 ml-4 text-gray-100 dark:text-black">
          {{ t('workflow.blocks.base.onError.info') }}
        </p>
      </div>
      <div class="mt-8">
        <label class="inline-flex">
          <ui-switch v-model="state.data.enable" />
          <span class="ml-2">
            {{ t('common.enable') }}
          </span>
        </label>
        <template v-if="state.data.enable">
          <div class="mt-4">
            <label class="inline-flex">
              <ui-switch v-model="state.data.retry" />
              <span class="ml-2">
                {{ t('workflow.blocks.base.onError.retry') }}
              </span>
            </label>
          </div>
          <transition-expand>
            <div v-if="state.data.retry" class="mt-2">
              <div class="inline-flex items-center">
                <span>
                  {{ t('workflow.blocks.base.onError.times.name') }}
                </span>
                <v-remixicon
                  :title="t('workflow.blocks.base.onError.times.description')"
                  name="riInformationLine"
                  size="20"
                  class="mr-2"
                />
                <ui-input
                  v-model.number="state.data.retryTimes"
                  type="number"
                  min="0"
                  class="w-20"
                />
              </div>
              <div class="inline-flex items-center ml-12">
                <span>
                  {{ t('workflow.blocks.base.onError.interval.name') }}
                </span>
                <v-remixicon
                  :title="
                    t('workflow.blocks.base.onError.interval.description')
                  "
                  name="riInformationLine"
                  size="20"
                  class="mr-2"
                />
                <ui-input
                  v-model.number="state.data.retryInterval"
                  type="number"
                  min="0"
                  class="w-20"
                />
                <span class="ml-1">
                  {{ t('workflow.blocks.base.onError.interval.second') }}
                </span>
              </div>
            </div>
          </transition-expand>
          <ui-select v-model="state.data.toDo" class="mt-4 w-56">
            <option
              v-for="type in toDoTypes"
              :key="type"
              :value="type"
              :disabled="type === 'fallback' && data.isInGroup ? true : null"
              class="to-do-type"
            >
              {{ t(`workflow.blocks.base.onError.toDo.${type}`) }}
            </option>
          </ui-select>
        </template>
      </div>
    </ui-modal>
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

const { t } = useI18n();

const toDoTypes = ['error', 'continue', 'fallback'];

const state = reactive({
  showModal: false,
  data: {
    retry: false,
    enable: false,
    retryTimes: 1,
    retryInterval: 2,
    toDo: 'error',
  },
});

watch(
  () => state.data,
  (onError) => {
    if (!state.showModal) return;

    emit('change', onError);
  },
  { deep: true }
);

onMounted(() => {
  state.data = Object.assign(state.data, props.data.data.onError || {});
});
</script>
<style scoped>
.to-do-type.is-active {
  @apply bg-accent dark:text-black text-gray-100 !important;
}
</style>
