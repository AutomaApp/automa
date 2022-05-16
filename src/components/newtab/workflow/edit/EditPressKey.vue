<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <edit-autocomplete class="mt-2">
      <ui-input
        :model-value="data.selector"
        class="w-full"
        autocomplete="off"
        label="Target element (Optional)"
        placeholder="CSS Selector or XPath"
        @change="updateData({ selector: $event })"
      />
    </edit-autocomplete>
    <div class="flex items-end">
      <ui-autocomplete
        :items="keysList"
        :model-value="dataKeys"
        hide-empty
        block
        class="mt-2"
      >
        <ui-input
          :label="t('workflow.blocks.press-key.key')"
          :model-value="dataKeys"
          :disabled="isRecordingKey"
          placeholder="(Enter, Esc, a, b, ...)"
          autocomplete="off"
          class="w-full"
          @change="updateKeys"
        />
      </ui-autocomplete>
      <ui-button
        v-tooltip="
          isRecordingKey
            ? t('common.cancel')
            : t('workflow.blocks.press-key.detect')
        "
        icon
        class="ml-2"
        @click="toggleRecordKeys"
      >
        <v-remixicon :name="isRecordingKey ? 'riCloseLine' : 'riFocus3Line'" />
      </ui-button>
    </div>
  </div>
</template>
<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { toCamelCase } from '@/utils/helper';
import { keyDefinitions } from '@/utils/USKeyboardLayout';
import EditAutocomplete from './EditAutocomplete.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update:data']);

const includedKeys = ['Enter', 'Control', 'Meta', 'Shift', 'Alt', 'Space'];
const filteredDefinitions = Object.keys(keyDefinitions).filter(
  (key) => key.trim().length <= 1 || key.startsWith('Arrow')
);
const keysList = filteredDefinitions.concat(includedKeys);
const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta'];

const { t } = useI18n();

const isRecordingKey = ref(false);
const dataKeys = ref(`${props.data.keys}`);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}
function updateKeys(value) {
  dataKeys.value = value;
  updateData({ keys: value });
}
function onKeydown(event) {
  if (event.repeat || modifierKeys.includes(event.key)) return;

  event.preventDefault();
  event.stopPropagation();

  const { shiftKey, metaKey, altKey, ctrlKey, key } = event;
  let pressedKey = key.length > 1 || shiftKey ? toCamelCase(key, true) : key;

  if (pressedKey === ' ') pressedKey = 'Space';
  else if (pressedKey === '+') pressedKey = 'NumpadAdd';

  const keys = [pressedKey];

  if (shiftKey) keys.unshift('Shift');
  if (metaKey) keys.unshift('Meta');
  if (altKey) keys.unshift('Alt');
  if (ctrlKey) keys.unshift('Control');

  updateKeys(keys.join('+'));
}
function onKeyup() {
  isRecordingKey.value = false;

  /* eslint-disable-next-line */
  detachKeyEvents();
}
function attachKeyEvents() {
  window.addEventListener('keyup', onKeyup);
  window.addEventListener('keydown', onKeydown);
}
function detachKeyEvents() {
  window.removeEventListener('keyup', onKeyup);
  window.removeEventListener('keydown', onKeydown);
}
function toggleRecordKeys() {
  isRecordingKey.value = !isRecordingKey.value;

  if (isRecordingKey.value) {
    attachKeyEvents();
  } else {
    detachKeyEvents();
  }
}

onBeforeUnmount(() => {
  detachKeyEvents();
});
</script>
