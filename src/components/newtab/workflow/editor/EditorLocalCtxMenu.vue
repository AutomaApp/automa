<template>
  <ui-popover
    v-model="state.show"
    :options="state.position"
    padding="p-3"
    @close="clearContextMenu"
  >
    <ui-list class="space-y-1 w-52">
      <ui-list-item
        v-for="item in state.items"
        :key="item.id"
        v-close-popover
        class="cursor-pointer text-sm justify-between"
        @click="item.event"
      >
        <span>
          {{ item.name }}
        </span>
        <span
          v-if="item.shortcut"
          class="text-sm capitalize text-gray-600 dark:text-gray-200"
        >
          {{ item.shortcut }}
        </span>
      </ui-list-item>
    </ui-list>
  </ui-popover>
</template>
<script setup>
import { onMounted, reactive, markRaw } from 'vue';
import { useI18n } from 'vue-i18n';
import { excludeGroupBlocks } from '@/utils/shared';
import { getReadableShortcut, getShortcut } from '@/composable/shortcut';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
  packageIo: Boolean,
  isPackage: Boolean,
});
const emit = defineEmits([
  'copy',
  'paste',
  'group',
  'ungroup',
  'saveBlock',
  'duplicate',
  'packageIo',
]);

const { t } = useI18n();
const state = reactive({
  show: false,
  items: [],
  position: {},
});

let ctxData = null;
const menuItems = {
  paste: {
    id: 'paste',
    name: t('workflow.editor.paste'),
    icon: 'riFileCopyLine',
    shortcut: getReadableShortcut('mod+v'),
    event: () => emit('paste', ctxData?.position),
  },
  delete: {
    id: 'delete',
    name: t('common.delete'),
    icon: 'riDeleteBin7Line',
    shortcut: 'Del',
    event: () => {
      props.editor.removeEdges(ctxData.edges);
      props.editor.removeNodes(ctxData.nodes);
    },
  },
  saveToFolder: {
    id: 'saveToFolder',
    name: t('packages.set'),
    event: () => {
      emit('saveBlock', ctxData);
    },
  },
  copy: {
    id: 'copy',
    name: t('workflow.editor.copy'),
    icon: 'riFileCopyLine',
    event: () => emit('copy', ctxData),
    shortcut: getReadableShortcut('mod+c'),
  },
  group: {
    id: 'group',
    name: t('workflow.editor.group'),
    icon: 'riFolderZipLine',
    event: () => emit('group', ctxData),
  },
  ungroup: {
    id: 'ungroup',
    name: t('workflow.editor.ungroup'),
    icon: 'riFolderOpenLine',
    event: () => emit('ungroup', ctxData),
  },
  duplicate: {
    id: 'duplicate',
    name: t('workflow.editor.duplicate'),
    icon: 'riFileCopyLine',
    event: () => emit('duplicate', ctxData),
    shortcut: getShortcut('editor:duplicate-block').readable,
  },
  setAsInput: {
    id: 'setAsInput',
    name: 'Set as block input',
    event: () => emit('packageIo', { type: 'inputs', ...ctxData }),
  },
  setAsOutput: {
    id: 'setAsOutput',
    name: 'Set as block output',
    event: () => emit('packageIo', { type: 'outputs', ...ctxData }),
  },
};

/* eslint-disable-next-line */
function showCtxMenu(items = [], event) {
  event.preventDefault();
  const { clientX, clientY } = event;

  if (props.isPackage && items.includes('saveToFolder')) {
    items.splice(items.indexOf('saveToFolder'), 1);
  }

  state.items = items.map((key) => markRaw(menuItems[key]));
  state.items.unshift(markRaw(menuItems.paste));

  state.position = {
    getReferenceClientRect: () => ({
      width: 0,
      height: 0,
      top: clientY,
      right: clientX,
      bottom: clientY,
      left: clientX,
    }),
  };
  state.show = true;
}
function clearContextMenu() {
  state.show = false;
  state.items = [];
  state.position = {};
}

onMounted(() => {
  props.editor.onNodeContextMenu(({ event, node }) => {
    const items = ['copy', 'duplicate', 'saveToFolder', 'delete'];
    if (node.label === 'blocks-group') {
      items.splice(3, 0, 'ungroup');
    } else if (!excludeGroupBlocks.includes(node.label)) {
      items.splice(3, 0, 'group');
    }

    const currCtxData = {
      edges: [],
      nodes: [node],
      position: { clientX: event.clientX, clientY: event.clientY },
    };

    if (
      props.isPackage &&
      props.packageIo &&
      event.target.closest('[data-handleid]')
    ) {
      const { handleid, nodeid } = event.target.dataset;

      currCtxData.nodeId = nodeid;
      currCtxData.handleId = handleid;

      items.unshift(
        event.target.classList.contains('source') ? 'setAsOutput' : 'setAsInput'
      );
    }

    showCtxMenu(items, event);
    ctxData = currCtxData;
  });
  props.editor.onEdgeContextMenu(({ event, edge }) => {
    showCtxMenu(['delete'], event);
    ctxData = { nodes: [], edges: [edge] };
  });
  props.editor.onPaneContextMenu((event) => {
    showCtxMenu([], event);
    ctxData = {
      nodes: [],
      edges: [],
      position: { clientX: event.clientX, clientY: event.clientY },
    };
  });
  props.editor.onSelectionContextMenu(({ event }) => {
    showCtxMenu(
      ['copy', 'duplicate', 'saveToFolder', 'group', 'delete'],
      event
    );
    ctxData = {
      nodes: props.editor.getSelectedNodes.value,
      edges: props.editor.getSelectedEdges.value,
      position: { clientX: event.clientX, clientY: event.clientY },
    };
  });
});
</script>
