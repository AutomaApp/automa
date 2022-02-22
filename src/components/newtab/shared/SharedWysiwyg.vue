<template>
  <div class="wysiwyg-editor">
    <slot v-if="editor" name="prepend" :editor="editor" />
    <editor-content :editor="editor" />
    <slot name="append" />
  </div>
</template>
<script setup>
import { shallowRef, onMounted, onBeforeUnmount, watch } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import CharacterCount from '@tiptap/extension-character-count';

const props = defineProps({
  modelValue: {
    type: [String, Object],
    default: null,
  },
  placeholder: {
    type: String,
    default: '',
  },
  limit: {
    type: Number,
    default: Infinity,
  },
  options: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:modelValue', 'count', 'change']);

const editor = shallowRef(null);

watch(
  () => props.modelValue,
  (value) => {
    const isSame =
      JSON.stringify(editor.value.getJSON()) === JSON.stringify(value);

    if (isSame) return;

    editor.value.commands.setContent(value, false);
  }
);

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    onUpdate: () => {
      const editorValue = editor.value.getJSON();

      emit('count', editor.value.storage.characterCount.characters());
      emit('change', editorValue);
      emit('update:modelValue', editorValue);
    },
    extensions: [
      Link,
      Image,
      StarterKit,
      Placeholder.configure({
        placeholder: props.placeholder,
      }),
      CharacterCount.configure({
        limit: props.limit,
      }),
    ],
    ...props.options,
  });

  emit('count', editor.value.storage.characterCount.characters());
});
onBeforeUnmount(() => {
  editor.value?.destroy();
});
</script>
<style>
.ProseMirror pre,
.ProseMirror code {
  font-family: 'JetBrains Mono', monospace;
}
.ProseMirror:focus {
  outline: none;
}
.ProseMirror p.is-editor-empty:first-child::before {
  @apply text-gray-400;
  content: attr(data-placeholder);
  float: left;
  pointer-events: none;
  height: 0;
}
</style>
