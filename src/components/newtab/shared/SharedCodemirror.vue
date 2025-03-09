<template>
  <div
    ref="containerEl"
    :class="{ 'hide-gutters': !lineNumbers }"
    class="codemirror relative rounded-lg"
  >
    <div
      v-if="!hideLang"
      class="absolute bottom-0 left-0 z-10 flex h-6 w-full items-center px-2 text-xs text-gray-300"
    >
      <div class="grow" />
      <span>
        {{ lang }}
      </span>
    </div>
  </div>
</template>
<script setup>
import { indentWithTab } from '@codemirror/commands';
import { css } from '@codemirror/lang-css';
import { html } from '@codemirror/lang-html';
import { javascript } from '@codemirror/lang-javascript';
import { json } from '@codemirror/lang-json';
import { EditorState } from '@codemirror/state';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { EditorView, basicSetup } from 'codemirror';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
// don't remove this unused import, the css is used in dynamic style
import { store } from '../settings/jsBlockWrap';

const props = defineProps({
  lang: {
    type: String,
    default: 'javascript',
  },
  modelValue: {
    type: String,
    default: '',
  },
  readonly: {
    type: Boolean,
    default: false,
  },
  lineNumbers: {
    type: Boolean,
    default: true,
  },
  extensions: {
    type: [Object, Array],
    default: () => [],
  },
  hideLang: Boolean,
});
const emit = defineEmits(['change', 'update:modelValue']);

let view = null;
const langs = { json, javascript, html, css };

const containerEl = ref(null);

const updateListener = EditorView.updateListener.of((event) => {
  if (event.docChanged) {
    event.state.sliceDoc(0, 20);

    const newValue = event.state.doc.toString();

    emit('change', newValue);
    emit('update:modelValue', newValue);
  }
});

const customExtension = Array.isArray(props.extensions)
  ? props.extensions
  : [props.extensions];

const state = EditorState.create({
  doc: props.modelValue,
  extensions: [
    oneDark,
    basicSetup,
    updateListener,
    langs[props.lang]?.(),
    EditorState.tabSize.of(2),
    keymap.of([indentWithTab]),
    EditorState.readOnly.of(props.readonly),
    ...customExtension,
  ],
});

watch(
  () => props.modelValue,
  (value) => {
    if (value === view.state.doc.toString()) return;

    view.dispatch({
      changes: { from: 0, to: view.state.doc.length, insert: value },
    });
  }
);

onMounted(() => {
  view = new EditorView({
    state,
    parent: containerEl.value,
  });
});
onBeforeUnmount(() => {
  view?.destroy();
});
</script>
<style>
.cm-content {
  flex-basis: fit-content;
}
.cm-line {
  white-space: v-bind(store.whiteSpace);
}
.codemirror.hide-gutters .cm-gutters {
  display: none !important;
}

.cm-editor {
  height: 100%;
  font-size: 15px;
  @apply pb-6;
}

.cm-editor .cm-gutters,
.cm-editor .cm-content,
.cm-tooltip.cm-tooltip-autocomplete > ul {
  font-family: 'Source Code Pro', Fira code, Fira Mono, Consolas, Menlo, Courier,
    monospace !important;
}

.cm-tooltip-autocomplete {
  margin-left: 0px;
  margin-top: 16px;
}

.cm-tooltip-autocomplete li[aria-selected] {
  background-color: #095fff !important;
  color: #ffffff !important;
}
</style>
