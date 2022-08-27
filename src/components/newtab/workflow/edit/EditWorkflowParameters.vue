<template>
  <div
    class="overflow-auto scroll"
    style="max-height: calc(100vh - 15rem); min-height: 200px"
  >
    <p
      v-if="state.parameters.length === 0"
      class="my-4 text-center text-gray-600 dark:text-gray-200"
    >
      No parameters
    </p>
    <table v-else class="w-full">
      <thead>
        <tr class="text-sm text-left">
          <th>Name</th>
          <th>Type</th>
          <th>Placeholder</th>
          <th>Default Value</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        <template v-for="(param, index) in state.parameters" :key="index">
          <tr class="align-top">
            <td>
              <ui-input
                :model-value="param.name"
                placeholder="Parameter name"
                @change="updateParam(index, $event)"
              />
            </td>
            <td>
              <ui-select
                :model-value="param.type"
                @change="updateParamType(index, $event)"
              >
                <option
                  v-for="type in paramTypesArr"
                  :key="type.id"
                  :value="type.id"
                >
                  {{ type.name }}
                </option>
              </ui-select>
            </td>
            <td>
              <ui-input v-model="param.placeholder" placeholder="A parameter" />
            </td>
            <td>
              <component
                :is="paramTypes[param.type].valueComp"
                v-if="paramTypes[param.type].valueComp"
                v-model="param.defaultValue"
                :param-data="param"
                :editor="true"
                max-width="250px"
              />
              <ui-input
                v-else
                v-model="param.defaultValue"
                :type="param.type === 'number' ? 'number' : 'text'"
                placeholder="NULL"
              />
            </td>
            <td>
              <ui-button icon @click="state.parameters.splice(index, 1)">
                <v-remixicon name="riDeleteBin7Line" />
              </ui-button>
            </td>
          </tr>
          <tr v-if="paramTypes[param.type].options">
            <td colspan="999" style="padding-top: 0">
              <ui-expand
                hide-header-icon
                header-class="flex items-center focus:ring-0 w-full"
              >
                <template #header="{ show }">
                  <v-remixicon
                    :rotate="show ? 270 : 180"
                    name="riArrowLeftSLine"
                    class="mr-2 transition-transform -ml-1"
                  />
                  <span>Options</span>
                </template>
                <div class="pl-[28px] mt-2 mb-4">
                  <component
                    :is="paramTypes[param.type].options"
                    v-model="param.data"
                  />
                </div>
              </ui-expand>
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
  <ui-button variant="accent" class="mt-4" @click="addParameter">
    Add parameter
  </ui-button>
</template>
<script setup>
import { reactive, watch } from 'vue';
import cloneDeep from 'lodash.clonedeep';
import * as workflowParameters from '@business/parameters';

const props = defineProps({
  data: {
    type: Array,
    default: () => [],
  },
});
const emit = defineEmits(['update']);

const paramTypes = {
  string: {
    id: 'string',
    name: 'Input (string)',
  },
  number: {
    id: 'number',
    name: 'Input (number)',
  },
  ...workflowParameters,
};
const paramTypesArr = Object.values(paramTypes).filter((item) => item.id);

const state = reactive({
  parameters: cloneDeep(props.data || []),
});

function addParameter() {
  state.parameters.push({
    data: {},
    name: 'param',
    type: 'string',
    defaultValue: '',
    placeholder: 'Text',
  });
}
function updateParam(index, value) {
  state.parameters[index].name = value.replace(/\s/g, '_');
}
function updateParamType(index, type) {
  const param = state.parameters[index];

  param.type = type;
  param.data = paramTypes[type].data || {};
}

watch(
  () => state.parameters,
  (parameters) => {
    emit('update', parameters);
  },
  { deep: true }
);
</script>
<style scoped>
table th,
table td {
  @apply p-1 font-normal;
}
</style>
