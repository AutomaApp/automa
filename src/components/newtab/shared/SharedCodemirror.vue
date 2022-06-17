<template>
  <div
    ref="containerEl"
    :class="{ 'hide-gutters': !lineNumbers }"
    class="codemirror relative overflow-auto rounded-lg"
  >
    <span
      class="text-sm text-gray-300 absolute bottom-2 right-2 z-10 pointer-events-none z-10"
    >
      {{ lang }}
    </span>
  </div>
</template>
<script setup>
import { onMounted, ref, onBeforeUnmount, watch } from 'vue';
import { json } from '@codemirror/lang-json';
import { indentWithTab } from '@codemirror/commands';
import { oneDark } from '@codemirror/theme-one-dark';
import { keymap } from '@codemirror/view';
import { javascript } from '@codemirror/lang-javascript';
import { EditorState } from '@codemirror/state';
import { EditorView, basicSetup } from 'codemirror';

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
});
const emit = defineEmits(['change', 'update:modelValue']);

let view = null;
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
    EditorState.tabSize.of(2),
    keymap.of([indentWithTab]),
    EditorState.readOnly.of(props.readonly),
    props.lang === 'javascript' ? javascript() : json(),
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
.codemirror.hide-gutters .cm-gutters {
  display: none !important;
}

.cm-editor {
  height: 100%;
  font-size: 15px;
}

.cm-editor .cm-gutters,
.cm-editor .cm-content,
.cm-tooltip.cm-tooltip-autocomplete > ul {
  font-family: 'Source Code Pro', Fira code, Fira Mono, Consolas, Menlo, Courier,
    monospace !important;
}
</style>
