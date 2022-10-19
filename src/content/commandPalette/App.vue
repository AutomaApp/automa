<template>
  <div
    v-if="state.active"
    class="bg-black bg-opacity-50 fixed text-black h-full w-full top-0 left-0 p-4"
    style="z-index: 99999999"
    @click.self="state.active = false"
  >
    <ui-card
      id="workflows-container"
      class="absolute w-full max-w-2xl"
      padding="p-0"
      style="left: 50%; top: 70px; transform: translateX(-50%)"
    >
      <div class="p-4">
        <label
          class="flex items-center bg-input rounded-lg h-12 transition focus-within:ring-2 ring-accent px-2"
        >
          <img :src="logoUrl" class="h-8 w-8" />
          <input
            ref="inputRef"
            type="text"
            class="h-full flex-1 focus:ring-0 rounded-lg px-2 bg-transparent"
            :placeholder="
              paramsState.active
                ? paramsState.workflow.name
                : 'Search workflows...'
            "
            @input="onInput"
            @keydown="onInputKeydown"
          />
          <template v-for="key in state.shortcutKeys" :key="key">
            <span
              class="rounded-md bg-box-transparent capitalize p-1 text-gray-600 ml-1 text-xs text-center inline-block border-2 border-gray-300 font-semibold"
              style="min-width: 29px; font-family: inherit"
            >
              {{ getReadableShortcut(key) }}
            </span>
          </template>
        </label>
      </div>
      <div
        class="px-4 pb-4 overflow-auto scroll workflows-list"
        style="max-height: calc(100vh - 200px)"
      >
        <div v-if="!state.retrieved" class="text-center mb-2">
          <ui-spinner color="text-accent" />
        </div>
        <template v-else>
          <div v-if="paramsState.active">
            <div class="p-2 rounded-lg bg-box-transparent">
              <p class="text-sm text-gray-500">Workflow parameters</p>
              <div>
                <span
                  v-for="(item, index) in paramsState.items"
                  :key="item.name"
                  :class="{
                    'font-semibold': paramsState.activeIndex === index,
                  }"
                >
                  {{ item.name }};
                </span>
              </div>
            </div>
            <div class="pl-2 text-gray-500">
              <p class="mt-2">
                Example:
                <span v-for="item in paramsState.items" :key="item.name">
                  {{ item.placeholder || defaultPlaceholders[item.type] }};
                </span>
              </p>
              <div class="flex items-center mt-4">
                <p class="flex-1 mr-4">
                  {{ paramsState.workflow.description }}
                </p>
                <p>
                  Press
                  <span
                    class="rounded-md bg-box-transparent p-1 text-gray-600 ml-1 text-xs text-center inline-block border-2 border-gray-300 font-semibold"
                  >
                    Escape
                  </span>
                  to cancel
                </p>
              </div>
            </div>
          </div>
          <template v-else>
            <p
              v-if="state.query && workflows.length === 0"
              class="text-gray-600 text-center"
            >
              Can't find workflows
            </p>
            <ui-list v-else class="space-y-1">
              <ui-list-item
                v-for="(workflow, index) in workflows"
                :id="`list-item-${index}`"
                :key="workflow.id"
                :active="index === state.selectedIndex"
                small
                color="bg-box-transparent list-item-active"
                class="group cursor-pointer"
                @mouseenter="state.selectedIndex = index"
                @click="executeWorkflow(workflow)"
              >
                <div class="w-8">
                  <img
                    v-if="workflow.icon?.startsWith('http')"
                    :src="workflow.icon"
                    class="overflow-hidden rounded-lg"
                    style="height: 26px; width: 26px"
                    alt="Can not display"
                  />
                  <v-remixicon
                    v-else
                    :name="workflow.icon || 'riGlobalLine'"
                    size="26"
                  />
                </div>
                <div class="flex-1 overflow-hidden mx-2">
                  <p class="text-overflow">
                    {{ workflow.name }}
                  </p>
                  <p class="text-overflow text-gray-500 leading-tight">
                    {{ workflow.description }}
                  </p>
                </div>
                <v-remixicon
                  name="riArrowGoForwardLine"
                  class="text-gray-600 invisible group-hover:visible"
                  size="20"
                  rotate="180"
                />
              </ui-list-item>
            </ui-list>
          </template>
        </template>
      </div>
    </ui-card>
  </div>
</template>
<script setup>
import {
  onMounted,
  onBeforeUnmount,
  shallowReactive,
  watch,
  ref,
  computed,
  inject,
} from 'vue';
import browser from 'webextension-polyfill';
import { sendMessage } from '@/utils/message';
import { debounce } from '@/utils/helper';

const os = navigator.appVersion.indexOf('Mac') !== -1 ? 'mac' : 'win';
const defaultPlaceholders = {
  string: 'Text',
  number: '123123',
};
const logoUrl = browser.runtime.getURL('/icon-128.png');

const inputRef = ref(null);
const state = shallowReactive({
  query: '',
  active: false,
  workflows: [],
  shortcutKeys: [],
  selectedIndex: -1,
});
const paramsState = shallowReactive({
  items: [],
  workflow: {},
  active: false,
  paramNames: [],
  activeIndex: 0,
  inputtedVal: '',
});

const rootElement = inject('rootElement');

const workflows = computed(() =>
  state.workflows.filter((workflow) =>
    workflow.name.toLocaleLowerCase().includes(state.query.toLocaleLowerCase())
  )
);

function getReadableShortcut(str) {
  const list = {
    option: {
      win: 'alt',
      mac: 'option',
    },
    mod: {
      win: 'ctrl',
      mac: '⌘',
    },
  };
  const regex = /option|mod/g;
  const replacedStr = str.replace(regex, (match) => {
    return list[match][os];
  });

  return replacedStr;
}
function clearParamsState() {
  Object.assign(paramsState, {
    items: [],
    workflow: {},
    active: false,
    activeIndex: 0,
    inputtedVal: '',
  });
}
function sendExecuteCommand(workflow, options = {}) {
  const workflowData = {
    ...workflow,
    includeTabId: true,
    options: { ...options, checkParams: false },
  };

  sendMessage('workflow:execute', workflowData, 'background');
  state.active = false;
}
function executeWorkflow(workflow) {
  if (!workflow) return;

  let triggerData = workflow.trigger;
  if (!triggerData) {
    const triggerNode = workflow.drawflow?.nodes?.find(
      (node) => node.label === 'trigger'
    );
    triggerData = triggerNode?.data;
  }

  if (triggerData?.parameters?.length > 0) {
    const keys = new Set();
    const params = [];
    triggerData.parameters.forEach((param) => {
      if (keys.has(param.name)) return;

      params.push(param);
      keys.add(param.name);
    });

    paramsState.workflow = workflow;
    paramsState.items = triggerData.parameters;
    paramsState.active = true;
  } else {
    sendExecuteCommand(workflow);
  }

  inputRef.value.value = '';
  state.query = '';
  paramsState.inputtedVal = '';
}
function onKeydown(event) {
  const { ctrlKey, altKey, metaKey, key, shiftKey } = event;

  if (key === 'Escape') {
    if (paramsState.active) {
      clearParamsState();
    } else {
      state.active = false;
    }
    return;
  }

  const shortcuts = window._automaShortcuts;
  if (!shortcuts || shortcuts.length < 1) return;

  const automaShortcut = shortcuts.every((shortcutKey) => {
    if (shortcutKey === 'mod') return ctrlKey || metaKey;
    if (shortcutKey === 'shift') return shiftKey;
    if (shortcutKey === 'option') return altKey;

    return shortcutKey === key.toLowerCase();
  });
  if (automaShortcut) {
    event.preventDefault();
    state.active = true;
    state.shortcutKeys = shortcuts;
  }
}
function onInputKeydown(event) {
  const { key } = event;

  if (key !== 'Escape') {
    event.stopPropagation();
  }

  if (['ArrowDown', 'ArrowUp'].includes(key)) {
    let nextIndex = state.selectedIndex;
    const maxIndex = workflows.value.length - 1;

    if (key === 'ArrowDown') {
      nextIndex += 1;
      if (nextIndex > maxIndex) nextIndex = 0;
    } else if (key === 'ArrowUp') {
      nextIndex -= 1;
      if (nextIndex < 0) nextIndex = maxIndex;
    }

    state.selectedIndex = nextIndex;
    return;
  }

  if (key === 'Enter') {
    if (paramsState.active) {
      const variables = {};
      const values = paramsState.inputtedVal.split(';');

      paramsState.items.forEach((item, index) => {
        let value = values[index] ?? '';
        if (item.type === 'number') value = +value ?? '';

        variables[item.name] = value;
      });

      sendExecuteCommand(paramsState.workflow, { data: { variables } });

      return;
    }

    executeWorkflow(workflows.value[state.selectedIndex]);
  }
}
function checkInView(container, element, partial = false) {
  const cTop = container.scrollTop;
  const cBottom = cTop + container.clientHeight;

  const eTop = element.offsetTop;
  const eBottom = eTop + element.clientHeight;

  const isTotal = eTop >= cTop && eBottom <= cBottom;
  const isPartial =
    partial &&
    ((eTop < cTop && eBottom > cTop) || (eBottom > cBottom && eTop < cBottom));

  return isTotal || isPartial;
}
function onInput(event) {
  const { value } = event.target;

  if (paramsState.active) {
    paramsState.inputtedVal = value;
    paramsState.activeIndex = value.split(';').length - 1;
  } else {
    state.query = value;
  }
}

watch(inputRef, () => {
  if (!inputRef.value) return;

  inputRef.value.focus();
});
watch(
  () => state.active,
  async () => {
    if (!state.retrieved && state.active) {
      const {
        workflows: localWorkflows,
        workflowHosts,
        teamWorkflows,
      } = await browser.storage.local.get([
        'workflows',
        'workflowHosts',
        'teamWorkflows',
      ]);
      state.workflows = [
        ...Object.values(workflowHosts || {}),
        ...Object.values(localWorkflows || {}),
        ...Object.values(Object.values(teamWorkflows || {})[0] || {}),
      ];

      state.retrieved = true;
    } else if (!state.active) {
      clearParamsState();
      state.query = '';
      state.selectedIndex = -1;
    }
  }
);
watch(
  () => state.selectedIndex,
  debounce((activeIndex) => {
    const container = rootElement.shadowRoot.querySelector(
      '#workflows-container .workflows-list'
    );
    const element = rootElement.shadowRoot.querySelector(
      `#list-item-${activeIndex}`
    );

    if (element && !checkInView(container, element)) {
      element.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth',
      });
    }
  }, 100)
);

onMounted(() => {
  browser.storage.local.get('automaShortcut').then(({ automaShortcut }) => {
    if (Array.isArray(automaShortcut) && automaShortcut.length < 1) return;

    let keys = ['mod', 'shift', 'e'];
    if (automaShortcut) keys = automaShortcut.split('+');

    state.shortcutKeys = keys;
    window._automaShortcuts = keys;
  });

  window.addEventListener('keydown', onKeydown);
});
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown);
});
</script>
