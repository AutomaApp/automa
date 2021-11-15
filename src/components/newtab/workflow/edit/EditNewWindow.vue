<template>
  <div class="mb-2 mt-4 space-y-2">
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      placeholder="Description"
      @change="updateData({ description: $event })"
    />
    <ui-select
      :model-value="data.windowState"
      class="w-full"
      placeholder="Window state"
      @change="updateData({ windowState: $event })"
    >
      <option v-for="state in windowStates" :key="state" :value="state">
        {{ state }}
      </option>
    </ui-select>
    <ui-checkbox
      :model-value="data.incognito"
      :disabled="!allowInIncognito"
      @change="updateData({ incognito: $event })"
    >
      Set as incognito window
      <span
        title="You must enable 'Allow in incognito' for this extension to use the option"
      >
        &#128712;
      </span>
    </ui-checkbox>
  </div>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import browser from 'webextension-polyfill';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const windowStates = ['normal', 'minimized', 'maximized', 'fullscreen'];
const allowInIncognito = ref(false);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

onMounted(async () => {
  allowInIncognito.value = await browser.extension.isAllowedIncognitoAccess();

  if (!allowInIncognito.value) {
    updateData({ incognito: false });
  }
});
</script>
