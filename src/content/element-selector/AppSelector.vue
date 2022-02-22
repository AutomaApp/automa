<template>
  <div class="mt-4">
    <ui-select
      :model-value="selectorType"
      class="w-full"
      @change="$emit('selector', $event)"
    >
      <option value="css">CSS Selector</option>
      <option value="xpath">XPath</option>
    </ui-select>
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
          class="mr-2 ml-4"
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
});
const emit = defineEmits(['change', 'parent', 'child', 'selector']);

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
