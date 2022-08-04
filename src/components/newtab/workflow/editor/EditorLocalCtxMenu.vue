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
        class="cursor-pointer justify-between"
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
import { getReadableShortcut, getShortcut } from '@/composable/shortcut';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['copy', 'paste', 'duplicate']);

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
  copy: {
    id: 'copy',
    name: t('workflow.editor.copy'),
    icon: 'riFileCopyLine',
    event: () => emit('copy', ctxData),
    shortcut: getReadableShortcut('mod+c'),
  },
  duplicate: {
    id: 'duplicate',
    name: t('workflow.editor.duplicate'),
    icon: 'riFileCopyLine',
    event: () => emit('duplicate', ctxData),
    shortcut: getShortcut('editor:duplicate-block').readable,
  },
};

/* eslint-disable-next-line */
function showCtxMenu(items = [], event) {
  event.preventDefault();
  const { clientX, clientY } = event;

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
    showCtxMenu(['copy', 'duplicate', 'delete'], event);
    ctxData = { nodes: [node], edges: [] };
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
    showCtxMenu(['copy', 'duplicate', 'delete'], event);
    ctxData = {
      nodes: props.editor.getSelectedNodes.value,
      edges: props.editor.getSelectedEdges.value,
    };
  });
});
</script>
