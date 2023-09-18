<template>
  <ui-autocomplete
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

function autocompleteFilter({ text, item }) {
  if (!text) return true;

  const query = text.replace('@', '.').split('.').pop();
  return item.toLocaleLowerCase().includes(query);
}
function onSearch(value) {
  const pathArr = (value ?? '').replace('@', '.').split('.');

  state.path = (pathArr.length > 1 ? pathArr.slice(0, -1) : pathArr).join('.');
  state.pathLen = pathArr.length;
}

const autocompleteList = computed(() => {
  const data =
    !state.path || state.pathLen <= 1
      ? autocompleteData.value
      : objectPath.get(autocompleteData.value, state.path);

  const list = typeof data === 'string' ? [] : Object.keys(data || {});

  return list;
});
</script>
