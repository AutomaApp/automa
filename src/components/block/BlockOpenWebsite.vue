<template>
  <div :id="componentId" class="p-4">
    <div class="flex items-center mb-2">
      <div
        :class="block.category.color"
        class="inline-block text-sm mr-4 p-2 rounded-lg"
      >
        <v-remixicon
          :path="icons.riGlobalLine"
          size="20"
          class="inline-block mr-1"
        />
        <span>Open website</span>
      </div>
      <div class="flex-grow"></div>
      <v-remixicon
        :path="icons.riDeleteBin7Line"
        class="cursor-pointer"
        @click="editor.removeNodeId(`node-${block.id}`)"
      />
    </div>
    <input
      :value="block.data.url"
      class="px-4 py-2 mb-1 rounded-lg block w-48 bg-input"
      placeholder="http://example.com"
      type="url"
      required
      @input="handleInput"
    />
    <ui-checkbox :model-value="block.data.active" @change="handleCheckbox">
      Set as active tab
    </ui-checkbox>
  </div>
</template>
<script setup>
import { VRemixIcon as VRemixicon } from 'v-remixicon';
import emitter from 'tiny-emitter/instance';
import UiCheckbox from '@/components/ui/UiCheckbox.vue';
import { icons } from '@/lib/v-remixicon';
import { debounce } from '@/utils/helper';
import { useComponentId } from '@/composable/componentId';
import { useEditorBlock } from '@/composable/editorBlock';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const componentId = useComponentId('open-website');
const block = useEditorBlock(`#${componentId}`, props.editor);

const handleInput = debounce(({ target }) => {
  target.reportValidity();

  const res = target.value.match(
    /* eslint-disable-next-line */
    /(http(s)?:\/\/.)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g
  );

  if (!res) return;

  const [url] = res;

  props.editor.updateNodeDataFromId(block.id, { ...block.data, url });
  block.data.url = url;
  emitter.emit('editor:data-changed', block.id);
}, 250);
function handleCheckbox(value) {
  props.editor.updateNodeDataFromId(block.id, { ...block.data, active: value });
  block.data.active = value;
  emitter.emit('editor:data-changed', block.id);
}
</script>
