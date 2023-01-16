<template>
  <div
    class="ml-2 inline-flex items-center rounded-lg bg-white dark:bg-gray-800"
  >
    <button
      v-tooltip="
        `${t('workflow.searchBlocks.title')} (${
          shortcut['editor:search-blocks'].readable
        })`
      "
      class="hoverable rounded-lg p-2"
      icon
      @click="toggleActiveSearch"
    >
      <v-remixicon name="riSearch2Line" />
    </button>
    <ui-autocomplete
      ref="autocompleteEl"
      :model-value="state.query"
      :items="state.autocompleteItems"
      :custom-filter="searchNodes"
      item-key="id"
      item-label="name"
      @cancel="blurInput"
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
        class="rounded-lg bg-transparent py-2 focus:ring-0"
        @focus="extractBlocks"
        @blur="clearState"
      />
      <template #item="{ item }">
        <div class="flex-1 overflow-hidden">
          <p class="text-overflow">
            {{ item.name }}
          </p>
          <p
            class="text-overflow text-sm leading-none text-gray-600 dark:text-gray-300"
          >
            {{ item.description }}
          </p>
        </div>
        <span
          title="Block id"
          class="text-overflow bg-box-transparent w-16 rounded-md p-1 text-xs text-gray-600 dark:text-gray-300"
        >
          {{ item.id }}
        </span>
      </template>
    </ui-autocomplete>
  </div>
</template>
<script setup>
/* eslint-disable vue/no-mutating-props */
import { reactive, ref } from 'vue';
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
  rectX: 0,
  rectY: 0,
  position: {
    x: 0,
    y: 0,
    zoom: 1,
  },
};

const autocompleteEl = ref(null);
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
  const isMatch = (str) =>
    str.toLocaleLowerCase().includes(text.toLocaleLowerCase());

  return isMatch(item.id) || isMatch(item.name) || isMatch(item.description);
}
function toggleActiveSearch() {
  state.active = !state.active;

  if (state.active) {
    document.querySelector('#search-blocks')?.focus();
  }
}
function extractBlocks() {
  const editorContainer = document.querySelector('.vue-flow');
  editorContainer.classList.add('add-transition');
  const { width, height } = editorContainer.getBoundingClientRect();

  initialState.rectX = width / 2;
  initialState.rectY = height / 2;
  initialState.position = props.editor.getTransform();

  state.autocompleteItems = props.editor.getNodes.value.map(
    ({ computedPosition, id, data, label }) => ({
      id,
      position: computedPosition,
      description: data.description || '',
      name: t(`workflow.blocks.${label}.name`),
    })
  );
}
function clearHighlightedNodes() {
  document.querySelectorAll('.search-select-node').forEach((el) => {
    el.classList.remove('search-select-node');
  });
}
function clearState() {
  if (!state.selected) {
    props.editor.setTransform(initialState.position);
  }

  state.query = '';
  state.active = false;
  state.selected = false;

  Object.assign(initialState, {
    rectX: 0,
    rectY: 0,
    position: {
      x: 0,
      y: 0,
      zoom: 1,
    },
  });

  autocompleteEl.value.state.showPopover = false;
  clearHighlightedNodes();

  setTimeout(() => {
    const editorContainer = document.querySelector('.vue-flow');
    editorContainer.classList.remove('add-transition');
  }, 500);
}
function blurInput() {
  document.querySelector('#search-blocks')?.blur();
}
function onSelectItem({ item }) {
  const { x, y } = item.position;
  const { rectX, rectY } = initialState;

  clearHighlightedNodes();
  document
    .querySelector(`[data-id="${item.id}"]`)
    ?.classList.add('search-select-node');

  props.editor.setTransform({
    zoom: 1,
    x: -(x - rectX),
    y: -(y - rectY),
  });
}
function onItemSelected(event) {
  state.selected = true;

  const node = props.editor.getNode.value(event.item.id);
  props.editor.addSelectedNodes([node]);

  onSelectItem(event);
  blurInput();
}
</script>
<style scoped>
input {
  transition: width 300ms ease;
}
</style>
<style>
.search-select-node > div {
  @apply ring-4;
}
.vue-flow.add-transition .vue-flow__transformationpane {
  transition: transform 250ms ease;
}
</style>
