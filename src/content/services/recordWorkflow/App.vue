<template>
  <div
    ref="rootEl"
    class="content rounded-lg bg-white shadow-xl fixed overflow-hidden text-black top-0 left-0"
    style="z-index: 99999999; font-size: 16px"
    :style="{
      transform: `translate(${draggingState.xPos}px, ${draggingState.yPos}px)`,
    }"
  >
    <div
      class="px-4 py-2 hoverable flex items-center transition select-none"
      :class="[draggingState.dragging ? 'cursor-grabbing' : 'cursor-grab']"
      @mouseup="toggleDragging(false, $event)"
      @mousedown="toggleDragging(true, $event)"
    >
      <span
        class="relative rounded-full bg-red-400 flex items-center justify-center"
        title="Recording workflow"
        style="height: 24px; width: 24px"
      >
        <v-remixicon
          name="riRecordCircleLine"
          class="relative z-10"
          size="20"
        />
        <span
          class="absolute animate-ping bg-red-400 rounded-full"
          style="height: 80%; width: 80%; animation-duration: 1.3s"
        ></span>
      </span>
      <p class="font-semibold ml-2">Automa</p>
      <div class="flex-grow"></div>
      <v-remixicon name="mdiDragHorizontal" />
    </div>
    <div class="p-4">
      <template v-if="selectState.status === 'idle'">
        <button
          class="px-4 py-2 rounded-lg bg-input transition w-full"
          @click="startSelecting()"
        >
          Select element
        </button>
        <button
          class="px-4 py-2 rounded-lg bg-input transition w-full mt-2"
          @click="startSelecting(true)"
        >
          Select list element
        </button>
      </template>
      <div v-else-if="selectState.status === 'selecting'" class="leading-tight">
        <p v-if="selectState.selectedElements.length === 0">
          Select an element by clicking on it
        </p>
        <template v-else>
          <template v-if="selectState.list && !selectState.listId">
            <label for="list-id" class="ml-1" style="font-size: 14px">
              Element list id
            </label>
            <input
              id="list-id"
              v-model="tempListId"
              placeholder="listId"
              class="px-4 py-2 rounded-lg bg-input w-full"
              @keyup.enter="saveElementListId"
            />
            <button
              :class="{ 'opacity-75 pointer-events-none': !tempListId }"
              class="px-4 py-2 w-full bg-accent rounded-lg mt-2 text-white"
              @click="saveElementListId"
            >
              Save
            </button>
          </template>
          <template v-else>
            <div class="flex items-center space-x-2 w-full">
              <input
                :value="selectState.childSelector"
                class="px-4 py-2 rounded-lg bg-input w-full"
                readonly
              />
              <template v-if="!selectState.list">
                <button @click="selectElementPath('up')">
                  <v-remixicon name="riArrowLeftLine" rotate="90" />
                </button>
                <button @click="selectElementPath('down')">
                  <v-remixicon name="riArrowLeftLine" rotate="-90" />
                </button>
              </template>
            </div>
            <select
              v-model="addBlockState.activeBlock"
              class="px-4 py-2 rounded-lg bg-input w-full mt-2"
            >
              <option value="" disabled selected>Select what to do</option>
              <option
                v-for="block in addBlockState.blocks"
                :key="block"
                :value="block"
              >
                {{ tasks[block].name }}
              </option>
            </select>
            <template
              v-if="
                ['get-text', 'attribute-value'].includes(
                  addBlockState.activeBlock
                )
              "
            >
              <select
                v-if="addBlockState.activeBlock === 'attribute-value'"
                v-model="addBlockState.activeAttr"
                class="px-4 py-2 rounded-lg bg-input mt-2 block w-full"
              >
                <option value="" selected disabled>Select attribute</option>
                <option
                  v-for="attr in addBlockState.attributes"
                  :key="attr.id"
                  :value="attr.id"
                >
                  {{ attr.name }}
                </option>
              </select>
              <label
                for="variable-name"
                class="text-sm ml-2 text-gray-600 mt-2"
              >
                Assign to variable
              </label>
              <input
                id="variable-name"
                v-model="addBlockState.varName"
                placeholder="Variable name"
                class="px-4 py-2 w-full rounded-lg bg-input"
              />
              <label
                for="select-column"
                class="text-sm ml-2 text-gray-600 mt-2"
              >
                Insert to table
              </label>
              <select
                id="select-column"
                v-model="addBlockState.column"
                class="block w-full rounded-lg px-4 py-2 bg-input"
              >
                <option value="" selected>Select column [none]</option>
                <option
                  v-for="column in addBlockState.workflowColumns"
                  :key="column.id"
                  :value="column.id"
                >
                  {{ column.name }}
                </option>
              </select>
            </template>
            <button
              v-if="addBlockState.activeBlock"
              :class="{
                'pointer-events-none opacity-75':
                  addBlockState.activeBlock === 'attribute-value' &&
                  !addBlockState.activeAttr,
              }"
              class="px-4 py-2 rounded-lg block w-full bg-accent text-white mt-4"
              @click="addFlowItem"
            >
              Save
            </button>
          </template>
        </template>
        <p class="mt-4" style="font-size: 14px">
          Press <kbd class="p-1 rounded-md bg-box-transparent">Esc</kbd> to
          cancel
        </p>
      </div>
    </div>
  </div>
  <shared-element-highlighter
    v-if="selectState.status === 'selecting'"
    :data="elementsHighlightData"
    :items="{
      hoveredElements: selectState.hoveredElements,
      selectedElements: selectState.selectedElements,
    }"
    style="z-index: 9999999"
    @update="selectState[$event.key] = $event.items"
  />
  <teleport to="body">
    <div
      v-if="selectState.status === 'selecting'"
      style="
        z-index: 999999;
        position: fixed;
        left: 0;
        top: 0;
        width: 100%;
        height: 100%;
        background-color: rgba(0, 0, 0, 0.3);
      "
    ></div>
  </teleport>
</template>
<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import { finder } from '@medv/finder';
import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import { elementsHighlightData, tasks } from '@/utils/shared';
import SharedElementHighlighter from '@/components/content/shared/SharedElementHighlighter.vue';
import findElementList from '../../elementSelector/listSelector';
import addBlock from './addBlock';

let prevHoverElement = null;
const mouseRelativePos = { x: 0, y: 0 };
const elementsPath = {
  path: [],
  cache: new WeakMap(),
};

const rootEl = ref(null);
const tempListId = ref('');

const selectState = reactive({
  listId: '',
  list: false,
  pathIndex: 0,
  status: 'idle',
  isInList: false,
  listSelector: '',
  childSelector: '',
  hoveredElements: [],
  selectedElements: [],
});
const draggingState = reactive({
  yPos: 20,
  dragging: false,
  xPos: window.innerWidth - 300,
});
const addBlockState = reactive({
  blocks: [],
  column: '',
  varName: '',
  attributes: [],
  activeAttr: '',
  activeBlock: '',
  workflowColumns: [],
});

const blocksList = {
  IMG: ['save-assets', 'attribute-value'],
  VIDEO: ['save-assets', 'attribute-value'],
  AUDIO: ['save-assets', 'attribute-value'],
  default: ['get-text', 'attribute-value'],
};

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
function addFlowItem() {
  const saveData = Boolean(addBlockState.column);
  const assignVariable = Boolean(addBlockState.varName);
  const block = {
    id: addBlockState.activeBlock,
    data: {
      saveData,
      assignVariable,
      waitForSelector: true,
      dataColumn: addBlockState.column,
      variableName: addBlockState.varName,
      selector: selectState.list
        ? selectState.listSelector
        : selectState.childSelector,
    },
  };

  if (selectState.isInList || selectState.listId) {
    const childSelector = selectState.isInList ? selectState.childSelector : '';

    block.data.selector = `{{loopData@${selectState.listId}}} ${childSelector}`;
  } else if (selectState.list) {
    block.data.multiple = true;
  }

  if (addBlockState.activeBlock === 'attribute-value') {
    block.data.attributeName = addBlockState.activeAttr;
  }

  addBlock(block).then(() => {
    addBlockState.column = '';
    addBlockState.varName = '';
    addBlockState.activeAttr = '';
  });
}
function selectElementPath(type) {
  let pathIndex =
    type === 'up' ? selectState.pathIndex + 1 : selectState.pathIndex - 1;
  let element = elementsPath.path[pathIndex];

  if ((type === 'up' && !element) || element?.tagName === 'BODY') return;

  if (type === 'down' && !element) {
    const previousElement = elementsPath.path[selectState.pathIndex];
    const childEl = Array.from(previousElement.children).find(
      (el) => !['STYLE', 'SCRIPT'].includes(el.tagName)
    );

    if (!childEl) return;

    element = childEl;
    elementsPath.path.unshift(childEl);
    pathIndex = 0;
  }

  selectState.pathIndex = pathIndex;
  selectState.selectedElements = [getElementRect(element)];
  selectState.childSelector = elementsPath.cache.has(element)
    ? elementsPath.cache.get(element)
    : finder(element);
}
function clearSelectState() {
  if (selectState.list && selectState.listId) {
    addBlock({
      id: 'loop-breakpoint',
      description: selectState.listId,
      data: {
        loopId: selectState.listId,
      },
    });
  }

  selectState.listId = '';
  selectState.list = false;
  selectState.status = 'idle';
  selectState.isSelecting = false;
  selectState.hoveredElements = [];
  selectState.selectedElements = [];

  const selectedList = document.querySelectorAll('[automa-el-list]');
  selectedList.forEach((element) => {
    element.removeAttribute('automa-el-list');
  });

  document.body.removeAttribute('automa-selecting');
}
function saveElementListId() {
  if (!tempListId.value) return;

  selectState.listId = toCamelCase(tempListId.value);
  tempListId.value = '';

  addBlock({
    id: 'loop-data',
    description: selectState.listId,
    data: {
      loopThrough: 'elements',
      loopId: selectState.listId,
      elementSelector: selectState.listSelector,
    },
  });
}
function getElementListChild(target, root) {
  const result = {
    elements: [],
    childSelector: null,
  };

  if (!target.hasAttribute('automa-el-list')) {
    result.childSelector = finder(target, {
      root,
      idName: () => false,
    });

    const selector = `${selectState.listSelector} ${result.childSelector}`;

    result.elements = Array.from(document.querySelectorAll(selector));
  }

  return result;
}
function getElementList(target, forceList = false) {
  const automaListEl = target.closest('[automa-el-list]');

  if (automaListEl) {
    return getElementListChild(target, automaListEl).elements;
  }
  if (forceList) {
    return [];
  }

  return findElementList(target) || [target];
}
function toggleDragging(value, event) {
  if (value) {
    const bounds = rootEl.value.getBoundingClientRect();
    const y = event.clientY - bounds.top;
    const x = event.clientX - bounds.left;

    mouseRelativePos.x = x;
    mouseRelativePos.y = y;
  } else {
    mouseRelativePos.x = 0;
    mouseRelativePos.y = 0;
  }

  draggingState.dragging = value;
}
function onKeyup({ key }) {
  if (key !== 'Escape') return;

  clearSelectState();

  window.removeEventListener('keyup', onKeyup);
}
function startSelecting(list = false) {
  selectState.list = list;
  selectState.isSelecting = true;
  selectState.status = 'selecting';

  document.body.setAttribute('automa-selecting', '');

  window.addEventListener('keyup', onKeyup);
}
function onMousemove({ clientX, clientY, target: eventTarget }) {
  if (draggingState.dragging) {
    draggingState.xPos = clientX - mouseRelativePos.x;
    draggingState.yPos = clientY - mouseRelativePos.y;

    return;
  }

  if (!selectState.isSelecting) return;

  const elementSelected = selectState.selectedElements.length > 0;
  const disable = selectState.list && !selectState.listId && elementSelected;
  if (disable) return;

  if (
    selectState.status === 'selecting' &&
    eventTarget.id !== 'automa-recording'
  ) {
    const { 1: target } = document.elementsFromPoint(clientX, clientY);

    if (prevHoverElement === target) return;

    prevHoverElement = target;
    let elementsRect = [];

    if (selectState.list) {
      const elements = getElementList(target, elementSelected) || [];
      elementsRect = elements.map((el) => getElementRect(el, true));
    } else {
      elementsRect = [getElementRect(target, true)];
    }

    selectState.hoveredElements = elementsRect;
  }
}
function getElementPath(el, root = document.documentElement) {
  const path = [el];

  /* eslint-disable-next-line */
  while ((el = el.parentNode) && !el.isEqualNode(root)) {
    path.push(el);
  }

  return path;
}
function onClick(event) {
  if (!selectState.isSelecting) return;

  const { target: eventTarget, clientY, clientX } = event;

  if (eventTarget.id === 'automa-recording') return;

  const disable =
    selectState.list &&
    !selectState.listId &&
    selectState.selectedElements.length > 0;
  if (disable) return;

  const { 1: target } = document.elementsFromPoint(clientX, clientY);
  const isInList = target.closest('[automa-el-list]');
  const getElementBlocks = (element) => {
    const elTag = element.tagName;
    const blocks = [...(blocksList[elTag] || blocksList.default)];
    const attrBlockIndex = blocks.indexOf('attribute-value');

    if (attrBlockIndex !== -1) {
      const attributes = Array.from(element.attributes).reduce(
        (acc, { name, value }) => {
          if (name === 'automa-el-list') return acc;

          acc.push({ id: name, name: `${name} (${value})`, value });

          return acc;
        },
        []
      );

      if (attributes.length === 0) blocks.splice(attrBlockIndex, 1);

      addBlockState.attributes = attributes;
    }

    addBlockState.blocks = blocks;
  };

  if (isInList) {
    const { elements, childSelector } = getElementListChild(target, isInList);

    getElementBlocks(elements[0]);

    selectState.isInList = true;
    selectState.childSelector = childSelector;
    selectState.selectedElements = elements.map((element) =>
      getElementRect(element)
    );

    return;
  }

  const prevSelectedList = document.querySelectorAll('[automa-el-list]');
  prevSelectedList.forEach((element) => {
    element.removeAttribute('automa-el-list');
  });

  const firstElement = selectState.hoveredElements[0].element;
  if (!firstElement) return;

  elementsPath.path = [];

  if (selectState.list) {
    selectState.hoveredElements.forEach(({ element }) => {
      element.setAttribute('automa-el-list', '');
    });

    const parentSelector = finder(firstElement.parentElement);
    const childSelector = firstElement.tagName.toLowerCase();
    const elementSelector = `${parentSelector} > ${childSelector}`;

    selectState.listSelector = elementSelector;
    selectState.childSelector = childSelector;
  } else {
    selectState.childSelector = finder(firstElement);
    elementsPath.path = getElementPath(firstElement);
  }

  selectState.isInList = false;
  selectState.selectedElements = selectState.hoveredElements;

  getElementBlocks(firstElement);
}
function attachListeners() {
  window.addEventListener('click', onClick);
  window.addEventListener('mousemove', onMousemove);
}
function detachListeners() {
  window.removeEventListener('keyup', onKeyup);
  window.removeEventListener('click', onClick);
  window.removeEventListener('mousemove', onMousemove);
}

watch(
  () => selectState.selectedElements,
  () => {
    addBlockState.column = '';
    addBlockState.varName = '';
    addBlockState.activeBlock = '';
  }
);

onMounted(() => {
  attachListeners();

  browser.storage.local
    .get(['recording', 'workflows'])
    .then(({ recording, workflows }) => {
      const workflow = workflows.find(({ id }) => recording.workflowId === id);

      addBlockState.workflowColumns = workflow?.table || [];
    });
});
onBeforeUnmount(detachListeners);
</script>
