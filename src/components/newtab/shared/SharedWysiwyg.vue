<template>
  <div class="wysiwyg-editor">
    <slot v-if="editor" name="prepend" :editor="editor" />
    <div
      v-if="editor && !readonly"
      class="p-2 rounded-lg backdrop-blur flex items-center sticky top-0 z-50 bg-box-transparent space-x-1 mb-2"
    >
      <button
        :class="{
          'bg-box-transparent text-primary': editor.isActive('heading', {
            level: 1,
          }),
        }"
        title="Heading 1"
        class="editor-menu-btn hoverable"
        @click="editor.commands.toggleHeading({ level: 1 })"
      >
        <v-remixicon name="riH1" />
      </button>
      <button
        :class="{
          'bg-box-transparent text-primary': editor.isActive('heading', {
            level: 2,
          }),
        }"
        title="Heading 2"
        class="editor-menu-btn hoverable"
        @click="editor.commands.toggleHeading({ level: 2 })"
      >
        <v-remixicon name="riH2" />
      </button>
      <span
        class="w-px h-5 bg-gray-300 dark:bg-gray-600"
        style="margin: 0 12px"
      ></span>
      <button
        v-for="item in menuItems"
        :key="item.id"
        :title="item.name"
        :class="{
          'bg-box-transparent text-primary': editor.isActive(item.id),
        }"
        class="editor-menu-btn hoverable"
        @click="editor.chain().focus()[item.action]().run()"
      >
        <v-remixicon :name="item.icon" />
      </button>
      <span
        class="w-px h-5 bg-gray-300 dark:bg-gray-600"
        style="margin: 0 12px"
      ></span>
      <button
        :class="{
          'bg-box-transparent text-primary': editor.isActive('blockquote'),
        }"
        title="Blockquote"
        class="editor-menu-btn hoverable"
        @click="editor.commands.toggleBlockquote()"
      >
        <v-remixicon name="riDoubleQuotesL" />
      </button>
      <button
        title="Insert image"
        class="editor-menu-btn hoverable"
        @click="insertImage(editor)"
      >
        <v-remixicon name="riImageLine" />
      </button>
      <button
        :class="{
          'bg-box-transparent text-primary': editor.isActive('link'),
        }"
        title="Link"
        class="editor-menu-btn hoverable"
        @click="setLink(editor)"
      >
        <v-remixicon name="riLinkM" />
      </button>
      <button
        v-show="editor.isActive('link')"
        title="Remove link"
        class="editor-menu-btn hoverable"
        @click="editor.commands.unsetLink()"
      >
        <v-remixicon name="riLinkUnlinkM" />
      </button>
    </div>
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
  readonly: Boolean,
});
const emit = defineEmits(['update:modelValue', 'count', 'change']);

const editor = shallowRef(null);
const menuItems = [
  { id: 'bold', name: 'Bold', icon: 'riBold', action: 'toggleBold' },
  { id: 'italic', name: 'Italic', icon: 'riItalic', action: 'toggleItalic' },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: 'riStrikethrough2',
    action: 'toggleStrike',
  },
];

function setLink() {
  const previousUrl = editor.value.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  if (url === null) return;

  if (url === '') {
    editor.value.chain().focus().extendMarkRange('link').unsetLink().run();

    return;
  }

  editor.value
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url, target: '_blank' })
    .run();
}
function insertImage() {
  const url = window.prompt('URL');

  if (url) {
    editor.value.chain().focus().setImage({ src: url }).run();
  }
}

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
    editable: !props.readonly,
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
  font-family: 'Source Code Pro', monospace;
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
