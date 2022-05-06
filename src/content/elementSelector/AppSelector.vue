<template>
  <div>
    <div class="flex items-center">
      <ui-select
        :model-value="selectorType"
        :disabled="selectList"
        class="w-full"
        @change="$emit('update:selectorType', $event)"
      >
        <option value="css">CSS Selector</option>
        <option value="xpath">XPath</option>
      </ui-select>
      <ui-button
        v-if="selectorType === 'css'"
        :class="{ 'text-primary': selectList }"
        icon
        class="ml-2"
        title="Select a list of elements"
        @click="$emit('update:selectList', !selectList)"
      >
        <v-remixicon name="riListUnordered" />
      </ui-button>
    </div>
    <div class="mt-2 flex items-center">
      <ui-input
        :model-value="selector"
        placeholder="Element selector"
        class="leading-normal flex-1 h-full element-selector"
        @change="updateSelector"
      >
        <template #prepend>
          <button class="absolute ml-2 left-0" @click="copySelector">
            <v-remixicon name="riFileCopyLine" />
          </button>
        </template>
      </ui-input>
      <template v-if="selectedCount === 1">
        <button
          class="mr-1 ml-2"
          title="Parent element"
          @click="$emit('parent')"
        >
          <v-remixicon rotate="90" name="riArrowLeftLine" />
        </button>
        <button title="Child element" @click="$emit('child')">
          <v-remixicon rotate="-90" name="riArrowLeftLine" />
        </button>
      </template>
    </div>
  </div>
</template>
<script setup>
import { inject } from 'vue';
import { debounce } from '@/utils/helper';
import UiInput from '@/components/ui/UiInput.vue';

const props = defineProps({
  selector: {
    type: String,
    default: '',
  },
  selectedCount: {
    type: Number,
    default: 0,
  },
  selectorType: {
    type: String,
    default: '',
  },
  selectList: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits([
  'change',
  'list',
  'parent',
  'child',
  'update:selectorType',
  'update:selectList',
]);

const rootElement = inject('rootElement');

const updateSelector = debounce((value) => {
  if (value === props.selector) return;

  emit('change', value);
}, 250);
function copySelector() {
  rootElement.shadowRoot.querySelector('input')?.select();

  navigator.clipboard.writeText(props.selector).catch((error) => {
    document.execCommand('copy');
    console.error(error);
  });
}
</script>
