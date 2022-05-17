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
          @click="state.hide = !state.hide"
        >
          <v-remixicon :name="state.hide ? 'riEyeOffLine' : 'riEyeLine'" />
        </button>
        <button class="hoverable p-1 rounded-md transition" @click="destroy">
          <v-remixicon name="riCloseLine" />
        </button>
      </div>
      <div class="p-4">
        <selector-query
          v-model:selectorType="state.selectorType"
          v-model:selectList="state.selectList"
          :selector="state.elSelector"
          :selected-count="state.selectedElements.length"
          @child="selectChildElement"
          @parent="selectParentElement"
          @change="updateSelectedElements"
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
    <shared-element-highlighter
      v-if="!state.hide"
      :disabled="state.hide"
      :data="elementsHighlightData"
      :items="{
        hoveredElements: state.hoveredElements,
        selectedElements: state.selectedElements,
      }"
      @update="state[$event.key] = $event.items"
    />
  </div>
  <teleport to="body">
    <div
      v-if="!state.hide"
      style="
        z-index: 9999999;
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
      "
    ></div>
  </teleport>
</template>
<script setup>
import { reactive, ref, watch, inject, onMounted, onBeforeUnmount } from 'vue';
import { getCssSelector } from 'css-selector-generator';
import { finder } from '@medv/finder';
import { elementsHighlightData } from '@/utils/shared';
import findElement from '@/utils/FindElement';
import SelectorQuery from '@/components/content/selector/SelectorQuery.vue';
import SelectorElementsDetail from '@/components/content/selector/SelectorElementsDetail.vue';
import SharedElementHighlighter from '@/components/content/shared/SharedElementHighlighter.vue';
import findElementList from './listSelector';

const selectedElement = {
  path: [],
  pathIndex: 0,
};

const originalFontSize = document.documentElement.style.fontSize;

const rootElement = inject('rootElement');

const cardEl = ref('cardEl');
const mainActiveTab = ref('selector');
const state = reactive({
  elSelector: '',
  listSelector: '',
  isDragging: false,
  selectList: false,
  isExecuting: false,
  selectElements: [],
  hoveredElements: [],
  selectorType: 'css',
  selectedElements: [],
  activeTab: 'attributes',
  hide: window.self !== window.top,
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

/* eslint-disable  no-use-before-define */
const getElementSelector = (element, options = {}) => {
  if (state.selectorType === 'css') {
    if (Array.isArray(element)) {
      return getCssSelector(element, {
        root: document.body,
        blacklist: [
          '[focused]',
          /focus/,
          '[src=*]',
          '[data-*]',
          '[href=*]',
          '[style=*]',
          '[value=*]',
          '[automa-*]',
        ],
        includeTag: true,
        ...options,
      });
    }

    return finder(element);
  }

  return generateXPath(element);
};

function generateXPath(element) {
  if (!element) return null;
  if (element.id !== '') return `id("${element.id}")`;
  if (element === document.body) return `//${element.tagName}`;

  let ix = 0;
  const siblings = element.parentNode.childNodes;

  for (let index = 0; index < siblings.length; index += 1) {
    const sibling = siblings[index];

    if (sibling === element) {
      return `${generateXPath(element.parentNode)}/${element.tagName}[${
        ix + 1
      }]`;
    }

    if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
      ix += 1;
    }
  }

  return null;
}
function toggleHighlightElement({ index, highlight }) {
  state.selectedElements[index].highlight = highlight;
}
function getElementRect(target, withElement = false) {
  if (!target) return {};

  const { x, y, height, width } = target.getBoundingClientRect();
  const result = {
    width: width + 4,
    height: height + 4,
    x: x - 2,
    y: y - 2,
  };

  if (withElement) result.element = target;

  return result;
}
function updateSelectedElements(selector) {
  state.elSelector = selector;

  try {
    const selectorType = state.selectorType === 'css' ? 'cssSelector' : 'xpath';
    let elements = findElement[selectorType]({ selector, multiple: true });
    const selectElements = [];

    if (selectorType === 'xpath') {
      elements = elements ? [elements] : [];
    }

    const elementsDetail = Array.from(elements).map((element, index) => {
      const attributes = Array.from(element.attributes).reduce(
        (acc, { name, value }) => {
          if (name === 'automa-el-list') return acc;

          acc[name] = value;

          return acc;
        },
        {}
      );

      const elementProps = {
        element,
        attributes,
        highlight: false,
        ...getElementRect(element),
      };

      if (element.tagName === 'SELECT') {
        const options = Array.from(element.querySelectorAll('option')).map(
          (option) => ({
            name: option.innerText,
            value: option.value,
          })
        );

        selectElements.push({ ...elementProps, options, index });
      }

      return elementProps;
    });

    state.selectElements = selectElements;
    state.selectedElements = elementsDetail;
  } catch (error) {
    state.selectElements = [];
    state.selectedElements = [];
  }
}
function getElementList(target) {
  const automaListEl = target.closest('[automa-el-list]');

  if (automaListEl) {
    if (target.hasAttribute('automa-el-list')) return [];

    const childSelector = finder(target, {
      root: automaListEl,
      idName: () => false,
    });
    const elements = document.querySelectorAll(
      `${state.listSelector} ${childSelector}`
    );

    return Array.from(elements);
  }

  return findElementList(target) || [target];
}
let prevHoverElement = null;
function handleMouseMove({ clientX, clientY, target }) {
  if (state.isDragging) {
    const height = window.innerHeight;
    const width = document.documentElement.clientWidth;

    if (clientY < 10) clientY = 10;
    else if (cardRect.height + clientY > height)
      clientY = height - cardRect.height;

    if (clientX < 10) clientX = 10;
    else if (cardRect.width + clientX > width) clientX = width - cardRect.width;

    cardRect.x = clientX;
    cardRect.y = clientY;

    return;
  }

  const { 1: realTarget } = document.elementsFromPoint(clientX, clientY);

  if (prevHoverElement === realTarget) return;
  prevHoverElement = realTarget;

  if (state.hide || rootElement === target) return;

  let elementsRect = [];

  if (state.selectList) {
    const elements = getElementList(realTarget) || [];

    elementsRect = elements.map((el) => getElementRect(el, true));
  } else {
    elementsRect = [getElementRect(realTarget)];
  }

  state.hoveredElements = elementsRect;
}
function handleClick(event) {
  const { target: eventTarget, path, ctrlKey, clientY, clientX } = event;

  if (eventTarget === rootElement || state.hide || state.isExecuting) return;
  event.stopPropagation();
  event.preventDefault();

  const { 1: target } = document.elementsFromPoint(clientX, clientY);

  if (state.selectList) {
    const firstElement = state.hoveredElements[0].element;

    if (!firstElement) return;

    const isInList = target.closest('[automa-el-list]');
    if (isInList) {
      const childSelector = finder(target, {
        root: isInList,
        idName: () => false,
      });
      updateSelectedElements(`${state.listSelector} ${childSelector}`, true);

      return;
    }

    const prevSelectedList = document.querySelectorAll('[automa-el-list]');
    prevSelectedList.forEach((element) => {
      element.removeAttribute('automa-el-list');
    });

    state.hoveredElements.forEach(({ element }) => {
      element.setAttribute('automa-el-list', '');
    });

    const parentSelector = finder(firstElement.parentElement);
    const elementSelector = `${parentSelector} > ${firstElement.tagName.toLowerCase()}`;

    state.listSelector = elementSelector;
    updateSelectedElements(elementSelector);

    return;
  }

  const getElementDetail = (element) => {
    const attributes = {};

    Array.from(element.attributes).forEach(({ name, value }) => {
      if (name === 'automa-el-list') return;

      attributes[name] = value;
    });

    return {
      ...getElementRect(element),
      element,
      attributes,
      highlight: false,
      outline: state.selectList && state.selectedElements.length,
    };
  };

  let targetElement = target;
  const targetElementDetail = getElementDetail(target);

  if (state.selectorType === 'css' && ctrlKey) {
    let elementIndex = -1;

    const elements = state.selectedElements.map(({ element }, index) => {
      if (element === targetElement) {
        elementIndex = index;
      }

      return element;
    });

    if (elementIndex === -1) {
      targetElement = [...elements, target];
      state.selectedElements.push(targetElementDetail);
    } else {
      targetElement = elements.splice(elementIndex, 1);
      state.selectedElements.splice(elementIndex, 1);
    }
  } else {
    state.selectedElements = [targetElementDetail];
  }

  state.elSelector = getElementSelector(targetElement);

  selectedElement.index = 0;
  selectedElement.path = path;
}
function selectChildElement() {
  if (selectedElement.path.length === 0 || state.hide) return;

  const currentEl = selectedElement.path[selectedElement.pathIndex];
  let childElement = currentEl;

  if (selectedElement.pathIndex <= 0) {
    const childEl = Array.from(currentEl.children).find(
      (el) => !['STYLE', 'SCRIPT'].includes(el.tagName)
    );

    if (currentEl.childElementCount === 0 || currentEl === childEl) return;

    childElement = childEl;
    selectedElement.path.unshift(childEl);
    selectedElement.pathIndex = 0;
  } else {
    selectedElement.pathIndex -= 1;
    childElement = selectedElement.path[selectedElement.pathIndex];
  }

  updateSelectedElements(getElementSelector(childElement));
}
function selectParentElement() {
  if (selectedElement.path.length === 0 || state.hide) return;

  const parentElement = selectedElement.path[selectedElement.pathIndex];

  if (parentElement.tagName === 'HTML') return;

  selectedElement.pathIndex += 1;

  updateSelectedElements(getElementSelector(parentElement));
}
function handleMouseUp() {
  if (state.isDragging) state.isDragging = false;
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

  window.addEventListener('mouseup', handleMouseUp);
  window.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick, true);
}
function detachListeners() {
  cardElementObserver.disconnect();

  window.removeEventListener('mouseup', handleMouseUp);
  window.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('click', handleClick, true);
}

watch(
  () => state.isDragging,
  (value) => {
    document.body.toggleAttribute('automa-isDragging', value);
  }
);
watch(
  () => state.selectList,
  (value) => {
    if (value) {
      state.selectedElements = [];
    } else {
      const prevSelectedList = document.querySelectorAll('[automa-el-list]');
      prevSelectedList.forEach((element) => {
        element.removeAttribute('automa-el-list');
      });
    }
  }
);

onMounted(() => {
  setTimeout(() => {
    const { height, width } = cardEl.value.getBoundingClientRect();

    cardRect.x = window.innerWidth - (width + 35);
    cardRect.y = 20;
    cardRect.width = width;
    cardRect.height = height;

    document.documentElement.style.setProperty(
      'font-size',
      '16px',
      'important'
    );
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
