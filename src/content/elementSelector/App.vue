<template>
  <div
    :class="{
      'select-none': state.isDragging,
      'bg-black bg-opacity-30': !state.hide,
    }"
    class="root pointer-events-none fixed top-0 left-0 h-full w-full text-black"
    style="z-index: 99999999"
  >
    <div
      ref="cardEl"
      :style="{ transform: `translate(${cardRect.x}px, ${cardRect.y}px)` }"
      style="width: 320px"
      class="root-card pointer-events-auto relative z-50 rounded-lg bg-white shadow-xl"
    >
      <div
        class="drag-button absolute z-50 cursor-move rounded-lg bg-white p-2 p-1 shadow-xl"
        style="top: -15px; left: -15px"
      >
        <v-remixicon
          name="riDragMoveLine"
          @mousedown="state.isDragging = true"
        />
      </div>
      <div class="flex items-center px-4 pt-4">
        <p class="text-lg font-semibold">Automa</p>
        <div class="grow"></div>
        <button
          class="hoverable mr-2 rounded-md p-1 transition"
          @mousedown.stop.prevent
          @click.stop.prevent="
            state.hide = !state.hide;
            clearConnectedPort();
          "
        >
          <v-remixicon :name="state.hide ? 'riEyeOffLine' : 'riEyeLine'" />
        </button>
        <button
          class="hoverable rounded-md p-1 transition"
          @mousedown.stop.prevent
          @click.stop.prevent="destroy"
        >
          <v-remixicon name="riCloseLine" />
        </button>
      </div>
      <div class="p-4">
        <selector-query
          v-model:selector-type="state.selectorType"
          v-model:select-list="state.selectList"
          :selector="state.elSelector"
          :settings-active="state.showSettings"
          :selected-count="state.selectedElements.length"
          @settings="state.showSettings = $event"
          @selector="updateSelector"
          @parent="selectElementPath('up')"
          @child="selectElementPath('down')"
        />
        <ui-button
          v-if="state.isSelectBlockElement"
          :disabled="!state.elSelector"
          variant="accent"
          class="mt-4 w-full"
          @click="saveSelector"
        >
          Select Element
        </ui-button>
        <selector-elements-detail
          v-if="
            !state.showSettings &&
            !state.hide &&
            state.selectedElements.length > 0
          "
          v-model:active-tab="state.activeTab"
          v-bind="{
            elSelector: state.elSelector,
            selectElements: state.selectElements,
            hideBlocks: state.isSelectBlockElement,
            selectedElements: state.selectedElements,
          }"
          @highlight="toggleHighlightElement"
          @execute="state.isExecuting = $event"
        />
        <div
          v-if="
            state.showSettings && state.selectorType === 'css' && !state.hide
          "
          class="mt-4"
        >
          <p class="mb-4 font-semibold">Selector settings</p>
          <ul class="space-y-4">
            <li>
              <label class="flex items-center space-x-2">
                <ui-switch v-model="selectorSettings.idName" />
                <p>Include element id</p>
              </label>
            </li>
            <li>
              <label class="flex items-center space-x-2">
                <ui-switch v-model="selectorSettings.tagName" />
                <p>Include tag name</p>
              </label>
            </li>
            <li>
              <label class="flex items-center space-x-2">
                <ui-switch v-model="selectorSettings.className" />
                <p>Include class name</p>
              </label>
            </li>
            <li>
              <label class="flex items-center space-x-2">
                <ui-switch v-model="selectorSettings.attr" />
                <p>Include attributes</p>
              </label>
              <template v-if="selectorSettings.attr">
                <label
                  class="ml-1 mt-2 block text-sm text-gray-600"
                  for="automa-attribute-names"
                >
                  Attribute names
                </label>
                <ui-textarea
                  id="automa-attribute-names"
                  v-model="selectorSettings.attrNames"
                  label="Attribute name"
                  placeholder="data-testid, aria-label, type"
                />
                <span class="text-sm">
                  Use commas to separate the attribute
                </span>
              </template>
            </li>
          </ul>
        </div>
        <p class="mt-1 text-sm text-gray-600">
          Click or press
          <kbd class="bg-box-transparent rounded-md p-1">Space</kbd> to select
          an element
        </p>
      </div>
    </div>
  </div>
  <shared-element-selector
    :hide="state.hide"
    :disabled="state.hide"
    :list="state.selectList"
    :selector-type="state.selectorType"
    :selected-els="state.selectedElements"
    :selector-settings="selectorSettings"
    with-attributes
    @selected="onElementsSelected"
  />
</template>
<script setup>
import SelectorElementsDetail from '@/components/content/selector/SelectorElementsDetail.vue';
import SelectorQuery from '@/components/content/selector/SelectorQuery.vue';
import SharedElementSelector from '@/components/content/shared/SharedElementSelector.vue';
import findSelector from '@/lib/findSelector';
import FindElement from '@/utils/FindElement';
import { debounce } from '@/utils/helper';
import {
  inject,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  toRaw,
  watch,
} from 'vue';
import browser from 'webextension-polyfill';
import { getElementRect } from '../utils';
import getSelectorOptions from './getSelectorOptions';

let connectedPort = null;
const originalFontSize = document.documentElement.style.fontSize;
const selectedElement = {
  path: [],
  pathIndex: 0,
  cache: new WeakMap(),
};

const rootElement = inject('rootElement');

const cardEl = ref('cardEl');
const state = reactive({
  hide: false,
  elSelector: '',
  destroyed: false,
  isDragging: false,
  selectList: false,
  isExecuting: false,
  selectElements: [],
  showSettings: false,
  selectorType: 'css',
  selectedElements: [],
  activeTab: 'attributes',
  isSelectBlockElement: false,
});
const cardRect = reactive({
  x: 0,
  y: 0,
  height: 0,
  width: 0,
});
const selectorSettings = reactive({
  idName: true,
  tagName: true,
  attr: true,
  className: true,
  attrNames: 'data-testid',
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
    : findSelector(element, getSelectorOptions(selectorSettings));
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
function clearConnectedPort() {
  if (!connectedPort) return;

  connectedPort = null;
  state.isSelectBlockElement = false;
}
function onVisibilityChange() {
  if (!connectedPort || document.visibilityState !== 'hidden') return;

  clearConnectedPort();
}
function saveSelector() {
  if (!connectedPort) return;

  connectedPort.postMessage(state.elSelector);
  clearConnectedPort();
  destroy();
}
function attachListeners() {
  cardElementObserver.observe(cardEl.value);

  window.addEventListener('message', onMessage);
  window.addEventListener('mouseup', onMouseup);
  window.addEventListener('mousemove', onMousemove);
  document.addEventListener('visibilitychange', onVisibilityChange);
}
function detachListeners() {
  cardElementObserver.disconnect();

  window.removeEventListener('message', onMessage);
  window.removeEventListener('mouseup', onMouseup);
  window.removeEventListener('mousemove', onMousemove);
  document.removeEventListener('visibilitychange', onVisibilityChange);
}

watch(
  () => state.isDragging,
  (value) => {
    document.body.toggleAttribute('automa-isDragging', value);
  }
);
watch(
  selectorSettings,
  (settings) => {
    browser.storage.local.set({
      selectorSettings: toRaw(settings),
    });
  },
  { deep: true }
);

browser.runtime.onConnect.addListener((port) => {
  clearConnectedPort();

  connectedPort = port;
  state.isSelectBlockElement = true;

  port.onDisconnect.addListener(clearConnectedPort);
});

onMounted(() => {
  browser.storage.local.get('selectorSettings').then((storage) => {
    const settings = storage.selectorSettings || {};
    Object.assign(selectorSettings, settings);
  });

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
