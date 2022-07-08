<template>
  <ui-autocomplete
    :disabled="true"
    :items="autocompleteList"
    :trigger-char="['{{', '}}']"
    :custom-filter="autocompleteFilter"
    :replace-after="['@', '.']"
    block
    @search="onSearch"
  >
    <slot />
  </ui-autocomplete>
</template>
<script setup>
import { inject, shallowReactive, computed } from 'vue';
import objectPath from 'object-path';

defineProps({
  disabled: Boolean,
});

const autocompleteData = inject('autocompleteData', {});
const state = shallowReactive({
  path: '',
  pathLen: -1,
});

const cache = new Map();

function autocompleteFilter({ text, item }) {
  const query = text.replace('@', '.').split('.').pop();

  return item.toLocaleLowerCase().includes(query);
}
function onSearch(value) {
  const path = (value ?? '').replace('@', '.');
  const pathArr = path.split('.');

  if (pathArr.length <= 1) {
    state.path = '';
    state.pathLen = 0;

    return;
  }

  if (pathArr.length !== state.pathLen) {
    state.path = path.endsWith('.') ? path.slice(0, -1) : path;
    state.pathLen = pathArr.length;
  }
}

const autocompleteList = computed(() => {
  if (cache.has(state.path)) {
    return cache.get(state.path);
  }

  const data =
    !state.path || state.pathLen < 1
      ? autocompleteData.value
      : objectPath.get(autocompleteData.value, state.path);

  const list = typeof data === 'string' ? [] : Object.keys(data || {});

  cache.set(state.path, list);

  return list;
});
</script>
