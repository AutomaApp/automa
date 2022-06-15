<template>
  <div
    class="bg-white dark:bg-gray-800 ml-2 inline-flex items-center rounded-lg"
  >
    <button
      v-tooltip="
        `${t('workflow.searchBlocks.title')} (${
          shortcut['editor:search-blocks'].readable
        })`
      "
      class="hoverable p-2 rounded-lg rounded-lg"
      icon
      @click="toggleActiveSearch"
    >
      <v-remixicon name="riSearch2Line" />
    </button>
    <ui-autocomplete
      :model-value="state.query"
      :items="state.autocompleteItems"
      :custom-filter="searchNodes"
      item-key="id"
      item-label="name"
      @select="onSelectItem"
      @selected="onItemSelected"
    >
      <input
        id="search-blocks"
        v-model="state.query"
        :placeholder="t('common.search')"
        :style="{ width: state.active ? '250px' : '0px' }"
        type="search"
        autocomplete="off"
        class="py-2 focus:ring-0 rounded-lg bg-transparent"
        @focus="extractBlocks"
        @blur="clearState"
      />
      <template #item="{ item }">
        <div class="flex-1 overflow-hidden">
          <p class="text-overflow">
            {{ item.name }}
          </p>
          <p
            class="text-sm text-overflow leading-none text-gray-600 dark:text-gray-300"
          >
            {{ item.description }}
          </p>
        </div>
      </template>
    </ui-autocomplete>
  </div>
</template>
<script setup>
/* eslint-disable vue/no-mutating-props */
import { reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useShortcut } from '@/composable/shortcut';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();

const initialState = {
  zoom: 1,
  rectX: 0,
  rectY: 0,
  canvasX: 0,
  canvasY: 0,
};
const state = reactive({
  query: '',
  active: false,
  selected: false,
  autocompleteItems: [],
});

const shortcut = useShortcut('editor:search-blocks', () => {
  state.active = true;
  document.querySelector('#search-blocks')?.focus();
});

function searchNodes({ item, text }) {
  const query = text.toLocaleLowerCase();

  return (
    item.name.toLocaleLowerCase().includes(query) ||
    item.description.toLocaleLowerCase().includes(query)
  );
}
function toggleActiveSearch() {
  state.active = !state.active;

  if (state.active) {
    document.querySelector('#search-blocks')?.focus();
  }
}
function extractBlocks() {
  const { width, height } = props.editor.container.getBoundingClientRect();
  initialState.rectX = width / 2;
  initialState.rectY = height / 2;
  initialState.zoom = props.editor.zoom;
  initialState.canvasX = props.editor.canvas_x;
  initialState.canvasY = props.editor.canvas_y;

  const { drawflow } = props.editor.export();
  state.autocompleteItems = Object.values(drawflow.Home.data).map(
    ({ id, name, data, pos_x, pos_y }) => ({
      id,
      pos_x,
      pos_y,
      description: data.description || '',
      name: t(`workflow.blocks.${name}.name`),
    })
  );

  props.editor.precanvas.style.transition = 'transform 300ms ease';
}
function clearHighlightedNodes() {
  document.querySelectorAll('.search-select-node').forEach((el) => {
    el.classList.remove('search-select-node');
  });
}
function clearState() {
  if (!state.selected) {
    const { canvasX, canvasY, zoom } = initialState;
    props.editor.translate_to(canvasX, canvasY, zoom);
  }

  state.query = '';
  state.active = false;
  state.selected = false;

  Object.assign(initialState, {
    zoom: 1,
    rectX: 0,
    rectY: 0,
    canvasX: 0,
    canvasY: 0,
  });

  clearHighlightedNodes();

  setTimeout(() => {
    props.editor.precanvas.style.transition = '';
  }, 500);
}
function onSelectItem({ item }) {
  if (props.editor.zoom !== 1) {
    /* eslint-disable-next-line */
    props.editor.zoom = 1;
    props.editor.zoom_refresh();
  }

  clearHighlightedNodes();
  document
    .querySelector(`#node-${item.id}`)
    ?.classList.add('search-select-node');

  const { rectX, rectY } = initialState;
  props.editor.translate_to(
    -(item.pos_x - rectX),
    -(item.pos_y - rectY),
    props.editor.zoom
  );
}
function onItemSelected(event) {
  state.selected = true;
  onSelectItem(event);
}
</script>
<style scoped>
input {
  transition: width 250ms ease;
}
</style>
<style>
.search-select-node .drawflow_content_node {
  @apply ring-4;
}
</style>
