<template>
  <div
    :class="{
      'select-none': state.isDragging,
      'bg-black bg-opacity-30': !state.hide,
    }"
    class="root fixed h-full w-full pointer-events-none top-0 text-black left-0"
  >
    <div
      ref="cardEl"
      :style="{ transform: `translate(${cardRect.x}px, ${cardRect.y}px)` }"
      style="width: 320px"
      class="absolute root-card bg-white shadow-xl z-50 p-4 pointer-events-auto rounded-lg"
    >
      <div
        class="absolute p-2 drag-button shadow-xl bg-white p-1 cursor-move rounded-lg"
        style="top: -15px; left: -15px"
      >
        <v-remixicon
          name="riDragMoveLine"
          @mousedown="state.isDragging = true"
        />
      </div>
      <div class="flex items-center">
        <p class="ml-1 text-lg font-semibold">Automa</p>
        <div class="flex-grow"></div>
        <ui-button icon class="mr-2" @click="state.hide = !state.hide">
          <v-remixicon :name="state.hide ? 'riEyeOffLine' : 'riEyeLine'" />
        </ui-button>
        <ui-button icon @click="destroy">
          <v-remixicon name="riCloseLine" />
        </ui-button>
      </div>
      <ui-tabs v-model="mainActiveTab" fill class="mt-2">
        <ui-tab value="selector"> Selector </ui-tab>
        <ui-tab value="workflow"> Workflow </ui-tab>
      </ui-tabs>
      <ui-tab-panels :model-value="mainActiveTab">
        <ui-tab-panel value="selector">
          <app-selector
            v-model:selectorType="state.selectorType"
            v-model:selectList="state.selectList"
            :selector="state.elSelector"
            :selected-count="state.selectedElements.length"
            @child="selectChildElement"
            @parent="selectParentElement"
            @change="updateSelectedElements"
          />
          <app-elements-detail
            v-if="!state.hide && state.selectedElements.length > 0"
            v-model:active-tab="state.activeTab"
            v-bind="{
              elSelector: state.elSelector,
              selectElements: state.selectElements,
              selectedElements: state.selectedElements,
            }"
            @update="updateCardSize"
            @highlight="toggleHighlightElement"
            @execute="state.isExecuting = $event"
          />
        </ui-tab-panel>
      </ui-tab-panels>
    </div>
    <svg
      v-if="!state.hide"
      class="h-full w-full absolute top-0 pointer-events-none left-0 z-10"
    >
      <app-element-highlighter
        :items="state.hoveredElements"
        stroke="#fbbf24"
        fill="rgba(251, 191, 36, 0.1)"
      />
      <app-element-highlighter
        :items="state.selectedElements"
        stroke="#2563EB"
        active-stroke="#f87171"
        fill="rgba(37, 99, 235, 0.1)"
        active-fill="rgba(248, 113, 113, 0.1)"
      />
    </svg>
  </div>
</template>
<script setup>
import { reactive, ref, watch, inject, nextTick } from 'vue';
import { getCssSelector } from 'css-selector-generator';
import { debounce } from '@/utils/helper';
import { finder } from '@medv/finder';
import findElement from '@/utils/FindElement';
import AppSelector from './AppSelector.vue';
import AppElementsDetail from './AppElementsDetail.vue';
import AppElementHighlighter from './AppElementHighlighter.vue';
import findElementList from './listSelector';

const selectedElement = {
  path: [],
  pathIndex: 0,
};
let lastScrollPosY = window.scrollY;
let lastScrollPosX = window.scrollX;
const originalFontSize = document.documentElement.style.fontSize;

const rootElement = inject('rootElement');

const cardEl = ref('cardEl');
const mainActiveTab = ref('selector');
const state = reactive({
  activeTab: '',
  elSelector: '',
  listSelector: '',
  isDragging: false,
  selectList: false,
  isExecuting: false,
  selectElements: [],
  hoveredElements: [],
  selectorType: 'css',
  selectedElements: [],
  hide: window.self !== window.top,
});
const cardRect = reactive({
  x: 0,
  y: 0,
  height: 0,
  width: 0,
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
  if (prevHoverElement === target) return;

  prevHoverElement = target;

  if (state.isDragging) {
    const height = window.innerHeight;
    const width = document.documentElement.clientWidth;

    if (clientY < 10) clientY = 0;
    else if (cardRect.height + clientY > height)
      clientY = height - cardRect.height;

    if (clientX < 10) clientX = 0;
    else if (cardRect.width + clientX > width) clientX = width - cardRect.width;

    cardRect.x = clientX;
    cardRect.y = clientY;

    return;
  }

  if (state.hide || rootElement === target) return;

  let elementsRect = [];

  if (state.selectList) {
    const elements = getElementList(target) || [];

    elementsRect = elements.map((el) => getElementRect(el, true));
  } else {
    elementsRect = [getElementRect(target)];
  }

  state.hoveredElements = elementsRect;
}
function handleClick(event) {
  const { target, path, ctrlKey } = event;

  if (target === rootElement || state.hide || state.isExecuting) return;
  event.stopPropagation();
  event.preventDefault();

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

    const parentSelector = getCssSelector(firstElement.parentElement, {
      includeTag: true,
    });
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
function updateCardSize() {
  setTimeout(() => {
    cardRect.height = cardEl.value.getBoundingClientRect().height;
  }, 250);
}
const handleScroll = debounce(() => {
  if (state.hide) return;

  const yPos = window.scrollY - lastScrollPosY;
  const xPos = window.scrollX - lastScrollPosX;
  const updateState = (key) => {
    state[key].forEach((_, index) => {
      state[key][index].x -= xPos;
      state[key][index].y -= yPos;
    });
  };

  updateState('hoveredElements');
  updateState('selectedElements');

  lastScrollPosX = window.scrollX;
  lastScrollPosY = window.scrollY;
}, 100);
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

window.addEventListener('scroll', handleScroll);
window.addEventListener('mouseup', handleMouseUp);
window.addEventListener('mousemove', handleMouseMove);
document.addEventListener('click', handleClick, true);

watch(
  () => state.isDragging,
  (value) => {
    document.body.toggleAttribute('automa-isDragging', value);
  }
);
watch(() => [state.elSelector, state.activeTab, state.hide], updateCardSize);
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

nextTick(() => {
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
  }, 250);
});
</script>
<style>
.root {
  font-size: 16px;
  z-index: 9999999999;
  line-height: 1.5 !important;
  font-family: 'Inter var', sans-serif;
  font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
}
.drag-button {
  transform: scale(0);
  transition: transform 200ms ease-in-out;
}
.root-card:hover .drag-button {
  transform: scale(1);
}
</style>
