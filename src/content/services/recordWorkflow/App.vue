<template>
  <div
    ref="rootEl"
    class="content fixed top-0 left-0 overflow-hidden rounded-lg bg-white text-black shadow-xl"
    style="z-index: 99999999; font-size: 16px"
    :style="{
      transform: `translate(${draggingState.xPos}px, ${draggingState.yPos}px)`,
    }"
  >
    <div
      class="hoverable flex select-none items-center px-4 py-2 transition"
      :class="[draggingState.dragging ? 'cursor-grabbing' : 'cursor-grab']"
      @mouseup="toggleDragging(false, $event)"
      @mousedown="toggleDragging(true, $event)"
    >
      <span
        class="relative flex cursor-pointer items-center justify-center rounded-full bg-red-400"
        style="height: 24px; width: 24px"
        title="Stop recording"
        @click="stopRecording"
      >
        <v-remixicon
          name="riRecordCircleLine"
          class="relative z-10"
          size="20"
        />
        <span
          class="absolute animate-ping rounded-full bg-red-400"
          style="height: 80%; width: 80%; animation-duration: 1.3s"
        ></span>
      </span>
      <p class="ml-2 font-semibold">Automa</p>
      <div class="grow"></div>
      <v-remixicon name="mdiDragHorizontal" />
    </div>
    <div class="p-4">
      <template v-if="selectState.status === 'idle'">
        <button
          class="bg-input w-full rounded-lg px-4 py-2 transition"
          @click="startSelecting()"
        >
          Select element
        </button>
        <button
          class="bg-input mt-2 w-full rounded-lg px-4 py-2 transition"
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
              class="bg-input w-full rounded-lg px-4 py-2"
              @keyup.enter="saveElementListId"
            />
            <button
              :class="{ 'opacity-75 pointer-events-none': !tempListId }"
              class="mt-2 w-full rounded-lg bg-accent px-4 py-2 text-white"
              @click="saveElementListId"
            >
              Save
            </button>
          </template>
          <template v-else>
            <div class="flex w-full items-center space-x-2">
              <input
                :value="selectState.childSelector || selectState.parentSelector"
                class="bg-input w-full rounded-lg px-4 py-2"
                readonly
              />
              <template
                v-if="
                  !selectState.list && !selectState.childSelector.includes('|>')
                "
              >
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
              class="bg-input mt-2 w-full rounded-lg px-4 py-2"
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
                class="bg-input mt-2 block w-full rounded-lg px-4 py-2"
              >
                <option value="" selected disabled>Select attribute</option>
                <option
                  v-for="(value, name) in addBlockState.attributes"
                  :key="name"
                  :value="name"
                >
                  {{ name }}({{ value.slice(0, 64) }})
                </option>
              </select>
              <label
                for="variable-name"
                class="ml-2 mt-2 text-sm text-gray-600"
              >
                Assign to variable
              </label>
              <input
                id="variable-name"
                v-model="addBlockState.varName"
                placeholder="Variable name"
                class="bg-input w-full rounded-lg px-4 py-2"
              />
              <label
                for="select-column"
                class="ml-2 mt-2 text-sm text-gray-600"
              >
                Insert to table
              </label>
              <select
                id="select-column"
                v-model="addBlockState.column"
                class="bg-input block w-full rounded-lg px-4 py-2"
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
              class="mt-4 block w-full rounded-lg bg-accent px-4 py-2 text-white"
              @click="addFlowItem"
            >
              Save
            </button>
          </template>
        </template>
        <p class="mt-4" style="font-size: 14px">
          Press <kbd class="bg-box-transparent rounded-md p-1">Esc</kbd> to
          cancel
        </p>
      </div>
    </div>
  </div>
  <shared-element-selector
    v-if="selectState.isSelecting"
    :selected-els="selectState.selectedElements"
    with-attributes
    only-in-list
    :list="selectState.list"
    :pause="
      selectState.selectedElements.length > 0 &&
      selectState.list &&
      !selectState.listId
    "
    @selected="onElementsSelected"
  />
</template>
<script setup>
import { ref, reactive, watch, onMounted, onBeforeUnmount } from 'vue';
import browser from 'webextension-polyfill';
import { toCamelCase } from '@/utils/helper';
import { tasks } from '@/utils/shared';
import findSelector from '@/lib/findSelector';
import SharedElementSelector from '@/components/content/shared/SharedElementSelector.vue';
import { getElementRect } from '../../utils';
import addBlock from './addBlock';

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
  isSelecting: false,
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

function stopRecording() {
  browser.runtime.sendMessage({
    type: 'background--recording:stop',
  });
}
function getElementBlocks(element) {
  if (!element) return;

  const elTag = element.tagName;
  const blocks = [...(blocksList[elTag] || blocksList.default)];
  const attrBlockIndex = blocks.indexOf('attribute-value');

  if (attrBlockIndex !== -1) {
    addBlockState.attributes = element.attributes;
  }

  addBlockState.blocks = blocks;
}
function onElementsSelected({ selector, elements, path }) {
  if (path) {
    elementsPath.path = path;
    selectState.pathIndex = 0;
  }

  getElementBlocks(elements[0]);
  selectState.selectedElements = elements;

  if (selectState.list) {
    if (!selectState.listSelector) {
      selectState.isInList = false;
      selectState.listSelector = selector;
      selectState.childSelector = selector;
      return;
    }

    selectState.isInList = true;
    selector = selector.replace(selectState.listSelector, '');
  }

  selectState.childSelector = selector;
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

  if (selectState.list) {
    if (selectState.isInList || selectState.listId) {
      const childSelector = selectState.isInList
        ? selectState.childSelector
        : '';
      block.data.selector = `{{loopData@${selectState.listId}}} ${childSelector}`;
    } else {
      block.data.multiple = true;
    }
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
    : findSelector(element);
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
  selectState.listSelector = '';
  selectState.childSelector = '';
  selectState.parentSelector = '';
  selectState.isSelecting = false;
  selectState.selectedElements = [];

  const selectedList = document.querySelectorAll('[automa-el-list]');
  selectedList.forEach((element) => {
    element.removeAttribute('automa-el-list');
  });

  const frameElements = document.querySelectorAll('iframe, frame');
  frameElements.forEach((element) => {
    element.contentWindow.postMessage(
      {
        type: 'automa:reset-element-selector',
      },
      '*'
    );
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
function onMousemove({ clientX, clientY }) {
  if (!draggingState.dragging) return;

  draggingState.xPos = clientX - mouseRelativePos.x;
  draggingState.yPos = clientY - mouseRelativePos.y;
}
function attachListeners() {
  window.addEventListener('mousemove', onMousemove);
}
function detachListeners() {
  window.removeEventListener('keyup', onKeyup);
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
      const workflow = Object.values(workflows).find(
        ({ id }) => recording.workflowId === id
      );

      addBlockState.workflowColumns = workflow?.table || [];
    });
});
onBeforeUnmount(detachListeners);
</script>
