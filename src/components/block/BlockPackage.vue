<template>
  <block-base
    :id="componentId"
    :data="data"
    :block-id="id"
    :block-data="block"
    class="w-64 block-package"
    @delete="$emit('delete', id)"
    @update="$emit('update', $event)"
    @settings="$emit('settings', $event)"
  >
    <div class="flex items-center">
      <img
        v-if="data.icon.startsWith('http')"
        :src="data.icon"
        width="36"
        height="36"
        class="mr-2 rounded-lg"
      />
      <div
        :class="data.disableBlock ? 'bg-box-transparent' : block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg dark:text-black overflow-hidden"
      >
        <v-remixicon
          v-if="!data.icon.startsWith('http')"
          :name="data.icon"
          size="20"
          class="inline-block mr-1"
        />
        <span class="text-overflow">{{ data.name || 'Unnamed package' }}</span>
      </div>
      <div class="flex-grow" />
      <v-remixicon
        v-if="state.isInstalled"
        title="Update package"
        name="riRefreshLine"
        class="cursor-pointer"
        @click="updatePackage"
      />
      <v-remixicon
        v-else
        title="Install package"
        name="riDownloadLine"
        class="cursor-pointer"
        @click="installPackage"
      />
    </div>
    <div class="grid grid-cols-2 mt-4 gap-x-2">
      <ul class="pkg-handle-container">
        <li
          v-for="input in data.inputs"
          :key="input.id"
          :title="input.name"
          class="relative target"
        >
          <Handle
            :id="`${id}-input-${input.id}`"
            type="target"
            :position="Position.Left"
          />
          <p class="text-overflow">{{ input.name }}</p>
        </li>
      </ul>
      <ul class="pkg-handle-container">
        <li
          v-for="output in data.outputs"
          :key="output.id"
          :title="output.name"
          class="relative source"
        >
          <Handle
            :id="`${id}-output-${output.id}`"
            type="source"
            :position="Position.Right"
          />
          <p class="text-overflow">{{ output.name }}</p>
        </li>
      </ul>
    </div>
    <div
      v-if="data.author"
      class="mt-1 text-sm text-gray-600 flex items-center dark:text-gray-200"
    >
      <p>By {{ data.author }}</p>
      <a
        :href="`https://automa.site/packages/${data.id}`"
        target="_blank"
        title="Open package page"
        class="ml-2"
      >
        <v-remixicon size="18" name="riExternalLinkLine" />
      </a>
    </div>
  </block-base>
</template>
<script setup>
import { onMounted, shallowReactive } from 'vue';
import cloneDeep from 'lodash.clonedeep';
import { Handle, Position } from '@vue-flow/core';
import { usePackageStore } from '@/stores/package';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';
import BlockBase from './BlockBase.vue';

const props = defineProps({
  id: {
    type: String,
    default: '',
  },
  label: {
    type: String,
    default: '',
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: null,
  },
});
const emit = defineEmits(['update', 'delete', 'settings']);

const packageStore = usePackageStore();
const block = useEditorBlock(props.label);
const componentId = useComponentId('block-package');

const state = shallowReactive({
  isInstalled: false,
});

function installPackage() {
  packageStore
    .insert({ ...props.data, isExternal: Boolean(props.data.author) }, false)
    .then(() => {
      state.isInstalled = true;
    });
}
function removeConnections(type, old, newEdges) {
  const removedEdges = [];
  old.forEach((edge) => {
    const isNotDeleted = newEdges.find((item) => item.id === edge.id);
    if (isNotDeleted) return;

    const handleType = type.slice(0, -1);

    removedEdges.push(`${props.id}-${handleType}-${edge.id}`);
  });

  const edgesToRemove = props.editor.getEdges.value.filter(
    ({ sourceHandle, targetHandle }) => {
      if (type === 'outputs') {
        return removedEdges.includes(sourceHandle);
      }

      return removedEdges.includes(targetHandle);
    }
  );

  props.editor.removeEdges(edgesToRemove);
}
function updatePackage() {
  const pkg = packageStore.getById(props.data.id);
  if (!pkg) return;

  const currentInputs = [...props.data.inputs];
  const currentOutputs = [...props.data.outputs];

  removeConnections('inputs', currentInputs, pkg.inputs);
  removeConnections('outputs', currentOutputs, pkg.outputs);

  emit('update', cloneDeep(pkg));
}

onMounted(() => {
  state.isInstalled = packageStore.getById(props.data.id);
});
</script>
<style>
.pkg-handle-container li {
  @apply h-8 flex items-center text-sm;

  &.target .vue-flow__handle {
    margin-left: -33px;
  }
  &.source {
    @apply justify-end;
    .vue-flow__handle {
      margin-right: -33px;
    }
  }
}
</style>
