<template>
  <div
    :class="{
      'select-none': state.isDragging,
      'bg-black bg-opacity-30': !state.hide,
    }"
    class="root fixed h-full w-full pointer-events-none top-0 text-black left-0"
    style="z-index: 99999999"
  >
    <div
      ref="cardEl"
      :style="{ transform: `translate(${cardRect.x}px, ${cardRect.y}px)` }"
      style="width: 320px"
      class="relative root-card bg-white shadow-xl z-50 pointer-events-auto rounded-lg"
    >
      <div
        class="absolute p-2 drag-button z-50 shadow-xl bg-white p-1 cursor-move rounded-lg"
        style="top: -15px; left: -15px"
      >
        <v-remixicon
          name="riDragMoveLine"
          @mousedown="state.isDragging = true"
        />
      </div>
      <div class="flex px-4 pt-4 items-center">
        <ui-tabs
          v-if="false"
          v-model="mainActiveTab"
          type="fill"
          class="main-tab"
        >
          <ui-tab value="selector"> Selector </ui-tab>
          <ui-tab value="workflow"> Workflow </ui-tab>
        </ui-tabs>
        <p class="text-lg font-semibold">Automa</p>
        <div class="flex-grow"></div>
        <button
          class="mr-2 hoverable p-1 rounded-md transition"
          @click.stop.prevent="state.hide = !state.hide"
        >
          <v-remixicon :name="state.hide ? 'riEyeOffLine' : 'riEyeLine'" />
        </button>
        <button
          class="hoverable p-1 rounded-md transition"
          @click.stop.prevent="destroy"
        >
          <v-remixicon name="riCloseLine" />
        </button>
      </div>
      <div class="p-4">
        <selector-query
          v-model:selectorType="state.selectorType"
          v-model:selectList="state.selectList"
          :selector="state.elSelector"
          :selected-count="state.selectedElements.length"
          @selector="updateSelector"
          @parent="selectElementPath('up')"
          @child="selectElementPath('down')"
        />
        <selector-elements-detail
          v-if="!state.hide && state.selectedElements.length > 0"
          v-model:active-tab="state.activeTab"
          v-bind="{
            elSelector: state.elSelector,
            selectElements: state.selectElements,
            selectedElements: state.selectedElements,
          }"
          @highlight="toggleHighlightElement"
          @execute="state.isExecuting = $event"
        />
      </div>
    </div>
  </div>
  <shared-element-selector
    :hide="state.hide"
    :disabled="state.hide"
    :list="state.selectList"
    :selector-type="state.selectorType"
    :selected-els="state.selectedElements"
    with-attributes
    @selected="onElementsSelected"
  />
</template>
<script setup>
import { reactive, ref, watch, inject, onMounted, onBeforeUnmount } from 'vue';
import { debounce } from '@/utils/helper';
import findSelector from '@/lib/findSelector';
import FindElement from '@/utils/FindElement';
import SelectorQuery from '@/components/content/selector/SelectorQuery.vue';
import SharedElementSelector from '@/components/content/shared/SharedElementSelector.vue';
import SelectorElementsDetail from '@/components/content/selector/SelectorElementsDetail.vue';
import { getElementRect } from '../utils';

const originalFontSize = document.documentElement.style.fontSize;
const selectedElement = {
  path: [],
  pathIndex: 0,
  cache: new WeakMap(),
};

const rootElement = inject('rootElement');

const cardEl = ref('cardEl');
const mainActiveTab = ref('selector');
const state = reactive({
  hide: false,
  elSelector: '',
  isDragging: false,
  selectList: false,
  isExecuting: false,
  selectElements: [],
  selectorType: 'css',
  selectedElements: [],
  activeTab: 'attributes',
});
const cardRect = reactive({
  x: 0,
  y: 0,
  height: 0,
  width: 0,
});

const cardElementObserver = new ResizeObserver(([entry]) => {
  const { height, width } = entry.contentRect;

  cardRect.width = width;
  cardRect.height = height;
});

const updateSelector = debounce((selector) => {
  let frameSelector;
  let elSelector = selector;

  if (selector.includes('|>')) {
    [frameSelector, elSelector] = selector.split(/\|>(.+)/);
  }

  const selectorType = state.selectorType === 'css' ? 'cssSelector' : 'xpath';

  try {
    if (frameSelector) {
      const frame = FindElement[selectorType]({
        selector: frameSelector,
        multiple: false,
      });
      if (!['IFRAME', 'FRAME'].includes(frame.tagName)) return;

      const { top, left } = frame.getBoundingClientRect();
      frame.contentWindow.postMessage(
        {
          selectorType,
          selector: elSelector,
          type: 'automa:find-element',
          frameRect: { top, left },
        },
        '*'
      );
      return;
    }

    const elements = FindElement[selectorType]({
      selector: elSelector,
      multiple: true,
    });
    state.selectedElements = Array.from(elements || []).map((el) =>
      getElementRect(el, true)
    );
  } catch (error) {
    console.error(error);
    state.selectedElements = [];
  }
}, 200);

function toggleHighlightElement({ index, highlight }) {
  state.selectedElements[index].highlight = highlight;
}
function onElementsSelected({ selector, elements, path, selectElements }) {
  if (path) {
    selectedElement.path = path;
    selectedElement.pathIndex = 0;
  }

  state.elSelector = selector;
  state.selectedElements = elements || [];
  state.selectElements = selectElements || [];
}
function onMousemove({ clientX, clientY }) {
  if (!state.isDragging) return;

  const height = window.innerHeight;
  const width = document.documentElement.clientWidth;

  if (clientY < 10) clientY = 10;
  else if (cardRect.height + clientY > height)
    clientY = height - cardRect.height;

  if (clientX < 10) clientX = 10;
  else if (cardRect.width + clientX > width) clientX = width - cardRect.width;

  cardRect.x = clientX;
  cardRect.y = clientY;
}
function selectElementPath(type) {
  let pathIndex =
    type === 'up'
      ? selectedElement.pathIndex + 1
      : selectedElement.pathIndex - 1;
  let element = selectedElement.path[pathIndex];

  if ((type === 'up' && !element) || element?.tagName === 'BODY') return;

  if (type === 'down' && !element) {
    const previousElement = selectedElement.path[selectedElement.pathIndex];
    const childEl = Array.from(previousElement.children).find(
      (el) => !['STYLE', 'SCRIPT'].includes(el.tagName)
    );

    if (!childEl) return;

    element = childEl;
    selectedElement.path.unshift(childEl);
    pathIndex = 0;
  }

  selectedElement.pathIndex = pathIndex;

  state.selectedElements = [getElementRect(element, true)];
  state.elSelector = selectedElement.cache.has(element)
    ? selectedElement.cache.get(element)
    : findSelector(element);
}
function onMouseup() {
  if (state.isDragging) state.isDragging = false;
}
function onMessage({ data }) {
  if (data.type !== 'automa:selected-elements') return;

  state.selectedElements = data.elements;
}
function destroy() {
  rootElement.style.display = 'none';

  Object.assign(state, {
    hide: true,
    activeTab: '',
    elSelector: '',
    isDragging: false,
    isExecuting: false,
    hoveredElements: [],
    selectedElements: [],
  });

  const prevSelectedList = document.querySelectorAll('[automa-el-list]');
  prevSelectedList.forEach((element) => {
    element.removeAttribute('automa-el-list');
  });

  document.documentElement.style.fontSize = originalFontSize;
}
function attachListeners() {
  cardElementObserver.observe(cardEl.value);

  window.addEventListener('message', onMessage);
  window.addEventListener('mouseup', onMouseup);
  window.addEventListener('mousemove', onMousemove);
}
function detachListeners() {
  cardElementObserver.disconnect();

  window.removeEventListener('message', onMessage);
  window.removeEventListener('mouseup', onMouseup);
  window.removeEventListener('mousemove', onMousemove);
}

watch(
  () => state.isDragging,
  (value) => {
    document.body.toggleAttribute('automa-isDragging', value);
  }
);

onMounted(() => {
  setTimeout(() => {
    const { height, width } = cardEl.value.getBoundingClientRect();

    cardRect.x = window.innerWidth - (width + 35);
    cardRect.y = 20;
    cardRect.width = width;
    cardRect.height = height;
  }, 500);

  attachListeners();
});
onBeforeUnmount(() => {
  detachListeners();
});
</script>
<style>
.root {
  font-size: 16px;
  z-index: 99999;
  line-height: 1.5 !important;
  font-family: 'Inter var', sans-serif;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}
.root-card:hover .drag-button {
  transform: scale(1);
}
.drag-button {
  transform: scale(0);
  transition: transform 200ms ease-in-out;
}
.main-tab {
  background-color: transparent !important;
  padding: 0 !important;
}
.main-tab .ui-tab.is-active.fill {
  @apply bg-accent text-white !important;
}
</style>
