<template>
  <div
    class="on-block-error scroll overflow-auto"
    style="max-height: calc(100vh - 13rem)"
  >
    <div
      class="flex items-start rounded-lg bg-green-200 p-4 text-black dark:bg-green-300"
    >
      <v-remixicon name="riInformationLine" />
      <p class="ml-4 flex-1">
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
        <div class="mt-4">
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
            <div class="ml-12 inline-flex items-center">
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
        <div class="mt-4 flex items-center justify-between">
          <label class="inline-flex">
            <ui-switch v-model="state.insertData" />
            <span class="ml-2">
              {{ t('workflow.blocks.base.onError.insertData.name') }}
            </span>
          </label>
          <ui-button
            v-if="state.insertData"
            class="text-sm"
            @click="addDataToInsert"
          >
            Add item
          </ui-button>
        </div>
        <transition-expand>
          <table v-if="state.insertData" class="mt-2 w-full">
            <thead>
              <tr class="text-left text-sm">
                <th>Type</th>
                <th>Name</th>
                <th>Value</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, index) in state.dataToInsert" :key="index">
                <td>
                  <ui-select v-model="item.type">
                    <option value="table">
                      {{ t('workflow.table.title') }}
                    </option>
                    <option value="variable">
                      {{ t('workflow.variables.title') }}
                    </option>
                  </ui-select>
                </td>
                <td>
                  <ui-select
                    v-if="item.type === 'table'"
                    v-model="item.name"
                    placeholder="Select column"
                    class="mt-1 w-full"
                  >
                    <option
                      v-for="column in workflow.columns.value"
                      :key="column.id"
                      :value="column.id"
                    >
                      {{ column.name }}
                    </option>
                  </ui-select>
                  <ui-input
                    v-else
                    v-model="item.name"
                    placeholder="Variable name"
                  />
                </td>
                <td>
                  <ui-input v-model="item.value" placeholder="EMPTY" />
                </td>
                <td>
                  <v-remixicon
                    name="riCloseLine"
                    class="cursor-pointer text-gray-600 dark:text-gray-200"
                    @click="state.dataToInsert.splice(index, 1)"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </transition-expand>
      </template>
    </div>
  </div>
</template>
<script setup>
import { reactive, watch, onMounted, inject } from 'vue';
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

const workflow = inject('workflow', {});

function addDataToInsert() {
  if (!state.dataToInsert) state.dataToInsert = [];

  state.dataToInsert.push({
    type: 'table',
    name: '',
    value: '',
  });
}

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
table th,
table,
td {
  font-weight: normal;
  @apply p-1;
}

.to-do-type.is-active {
  @apply bg-accent dark:text-black text-gray-100 !important;
}
</style>
