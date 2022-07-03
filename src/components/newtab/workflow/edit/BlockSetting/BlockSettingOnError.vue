<template>
  <div class="on-block-error">
    <div
      class="p-4 rounded-lg bg-green-200 dark:bg-green-300 flex items-start text-black"
    >
      <v-remixicon name="riInformationLine" />
      <p class="flex-1 ml-4">
        {{ t('workflow.blocks.base.onError.info') }}
      </p>
    </div>
    <div class="mt-4">
      <label class="inline-flex">
        <ui-switch v-model="state.enable" />
        <span class="ml-2">
          {{ t('common.enable') }}
        </span>
      </label>
      <template v-if="state.enable">
        <div class="mt-2">
          <label class="inline-flex">
            <ui-switch v-model="state.retry" />
            <span class="ml-2">
              {{ t('workflow.blocks.base.onError.retry') }}
            </span>
          </label>
        </div>
        <transition-expand>
          <div v-if="state.retry" class="mt-2">
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
                v-model.number="state.retryTimes"
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
                :title="t('workflow.blocks.base.onError.interval.description')"
                name="riInformationLine"
                size="20"
                class="mr-2"
              />
              <ui-input
                v-model.number="state.retryInterval"
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
        <ui-select v-model="state.toDo" class="mt-2 w-56">
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

const toDoTypes = ['error', 'continue', 'fallback'];

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
<style scoped>
.to-do-type.is-active {
  @apply bg-accent dark:text-black text-gray-100 !important;
}
</style>
