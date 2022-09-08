<template>
  <ui-popover>
    <template #trigger>
      <ui-button class="w-full">
        Select block {{ props.data.blockId }}
      </ui-button>
    </template>
    <div class="w-64">
      <ui-input
        v-if="state.selectType === 'nodes'"
        v-model="state.query"
        placeholder="Search..."
        class="w-full mb-4"
      />
      <template v-else>
        <div
          class="flex items-center cursor-pointer"
          @click="state.selectType = 'nodes'"
        >
          <v-remixicon
            name="riArrowLeftSLine"
            title="Go back"
            class="mr-1 -ml-1"
          />
          <span class="flex-1 text-overflow">
            {{ getBlockName(selectedNode) }}
          </span>
        </div>
        <p class="mt-2 mb-4">Select {{ type }}</p>
      </template>
      <ui-list class="space-y-1">
        <ui-list-item
          v-for="(item, index) in items"
          :key="item.id"
          :active="isActive(item)"
          class="cursor-pointer"
          @click="selectItem(item)"
        >
          <p class="text-overflow">
            {{
              state.selectType === 'nodes'
                ? getBlockName(item, state.selectType)
                : `${type} ${index + 1}`
            }}
          </p>
        </ui-list-item>
      </ui-list>
      {{ data }}
    </div>
  </ui-popover>
</template>
<script setup>
/* eslint-disable */
import { reactive, computed, onMounted } from 'vue';
import { getBlocks } from '@/utils/getSharedData';

const props = defineProps({
  nodes: {
    type: Array,
    default: () => [],
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  type: {
    type: String,
    default: 'inputs',
  },
});
const emit = defineEmits(['update']);

const blocks = getBlocks();
const handleType = props.type === 'inputs' ? 'target' : 'source';

const state = reactive({
  query: '',
  selectType: 'nodes',
});

const includeQuery = (str) =>
  str.toLocaleLowerCase().includes(state.query.toLocaleLowerCase());

const selectedNode = computed(() =>
  props.nodes.find((node) => node.id === props.data.blockId)
);
const items = computed(() => {
  const query = state.query.toLocaleLowerCase();

  if (state.selectType === 'nodes') {
    return props.nodes.filter(({ data, label }) => {
      let additionalKey = false;

      if (data.name) additionalKey = includeQuery(data.name);
      else if (data.description) additionalKey = includeQuery(data.description);

      return includeQuery(blocks[label]?.name || '') || additionalKey;
    });
  }

  return selectedNode.value.handleBounds[handleType];
});

function updateData(data) {
  emit('update', data);
}
function selectItem(item) {
  if (state.selectType === 'nodes') {
    const payload = { blockId: item.id };

    if (props.data.blockId && props.data.blockId !== item.id) {
      payload.handleId = '';
    }

    updateData(payload);
    state.selectType = 'handle';
  } else {
    updateData({ handleId: item.id });
  }
}
function getBlockName(item, type) {
  const { label, data } = item;
  let name = blocks[label]?.name || '';

  if (data.name) name += ` (${data.name})`;
  else if (data.description) name += ` (${data.description})`;

  return name;
}
function isActive(item) {
  if (state.selectType === 'nodes') {
    return item.id === props.data.blockId;
  }

  return item.id === props.data.handleId;
}

onMounted(() => {
  if (props.data.blockId) {
    const blockExists = props.nodes.some(
      (node) => node.id === props.data.blockId
    );
    if (blockExists) {
      state.selectType = 'handle';
    } else {
      emit('update', { blockId: '', handleId: '' });
    }
  }
});
</script>
