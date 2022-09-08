<template>
  <label class="inline-flex items-center">
    <ui-switch v-model="packageState.settings.asBlock" />
    <span class="ml-4">
      {{ $t('packages.settings.asBlock') }}
    </span>
  </label>
  <div v-if="packageState.settings.asBlock" class="mt-6 pb-8 flex space-x-6">
    <div class="flex-1">
      <p class="font-semibold">Block inputs</p>
      <div class="mt-4">
        <div
          v-if="packageState.inputs.length > 0"
          class="grid grid-cols-12 gap-x-4"
        >
          <div class="col-span-5 pl-1 text-sm">Input name</div>
          <div class="col-span-6 pl-1 text-sm">Block</div>
        </div>
        <draggable
          v-model="packageState.inputs"
          group="inputs"
          handle=".handle"
          item-key="id"
        >
          <template #item="{ element, index }">
            <div
              class="grid grid-cols-12 mb-2 relative gap-x-4 items-center group"
            >
              <span
                class="absolute left-0 handle -ml-6 cursor-move invisible group-hover:visible"
              >
                <v-remixicon name="mdiDrag" />
              </span>
              <ui-input
                v-model="element.name"
                class="col-span-5"
                :placeholder="`Input ${index + 1}`"
              />
              <div class="flex items-center col-span-6">
                <ui-button
                  v-tooltip="'Go to block'"
                  class="mr-2"
                  icon
                  @click="$emit('goBlock', element.blockId)"
                >
                  <v-remixicon name="riFocus3Line" />
                </ui-button>
                <p
                  :title="getBlockIOName('inputs', element)"
                  class="text-overflow flex-1"
                >
                  {{ getBlockIOName('inputs', element) }}
                </p>
              </div>
              <div class="col-span-1 text-right">
                <v-remixicon
                  name="riDeleteBin7Line"
                  class="cursor-pointer text-gray-600 dark:text-gray-200 inline-block"
                  @click="deleteBlockIo('inputs', index)"
                />
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
    <hr class="border-r" />
    <div class="flex-1">
      <p class="font-semibold">Block outputs</p>
      <div class="mt-4">
        <div
          v-if="packageState.outputs.length > 0"
          class="grid grid-cols-12 gap-x-4"
        >
          <div class="col-span-5 pl-1 text-sm">Output name</div>
          <div class="col-span-6 pl-1 text-sm">Block</div>
        </div>
        <draggable
          v-model="packageState.outputs"
          group="outputs"
          handle=".handle"
          item-key="id"
        >
          <template #item="{ element, index }">
            <div
              class="grid grid-cols-12 mb-2 relative gap-x-4 items-center group"
            >
              <span
                class="absolute left-0 handle -ml-6 cursor-move invisible group-hover:visible"
              >
                <v-remixicon name="mdiDrag" />
              </span>
              <ui-input
                v-model="element.name"
                class="col-span-5"
                :placeholder="`Output ${index + 1}`"
              />
              <div class="flex items-center col-span-6">
                <ui-button
                  v-tooltip="'Go to block'"
                  class="mr-2"
                  icon
                  @click="$emit('goBlock', element.blockId)"
                >
                  <v-remixicon name="riFocus3Line" />
                </ui-button>
                <p
                  :title="getBlockIOName('outputs', element)"
                  class="text-overflow flex-1"
                >
                  {{ getBlockIOName('outputs', element) }}
                </p>
              </div>
              <div class="col-span-1 text-right">
                <v-remixicon
                  name="riDeleteBin7Line"
                  class="cursor-pointer text-gray-600 dark:text-gray-200 inline-block"
                  @click="deleteBlockIo('outputs', index)"
                />
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>
</template>
<script setup>
import { reactive, watch, onMounted } from 'vue';
import cloneDeep from 'lodash.clonedeep';
import Draggable from 'vuedraggable';
import { getBlocks } from '@/utils/getSharedData';
import { debounce } from '@/utils/helper';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update', 'goBlock']);

const blocks = getBlocks();

const state = reactive({
  retrieved: false,
});
const packageState = reactive({
  inputs: [],
  outputs: [],
  settings: { asBlock: false },
});

function deleteBlockIo(type, index) {
  packageState[type].splice(index, 1);
}

const cacheIOName = new Map();

function getNodeName({ label, data }) {
  let name = blocks[label]?.name || '';

  if (data.name) name += ` (${data.name})`;
  else if (data.description) name += ` (${data.description})`;

  return name;
}
function getBlockIOName(type, data) {
  if (!props.editor) return '';

  const cacheId = `${data.blockId}-${data.handleId}`;
  if (cacheIOName.has(cacheId)) return cacheIOName.get(cacheId);

  let name = '';

  const node = props.editor.getNode.value(data.blockId);
  if (!node) {
    name = 'Block not found';
  } else {
    const nodeName = getNodeName(node);
    const handleType = type === 'outputs' ? 'source' : 'target';
    const index = node.handleBounds[handleType].findIndex(
      (item) => item.id === data.handleId
    );
    const handleName =
      index === -1 ? 'Not found' : `${type.slice(0, -1)} ${index + 1}`;

    name = `${nodeName} > ${handleName}`;
  }

  cacheIOName.set(cacheId, name);

  return name;
}

watch(
  packageState,
  debounce(() => {
    if (state.retrieved) {
      emit('update', packageState);
    }
  }, 500),
  { deep: true }
);

onMounted(() => {
  Object.assign(
    packageState,
    cloneDeep({
      inputs: props.data.inputs,
      outputs: props.data.outputs,
      settings: props.data.settings || {},
    })
  );

  setTimeout(() => {
    state.retrieved = true;
  }, 1000);
});
</script>
