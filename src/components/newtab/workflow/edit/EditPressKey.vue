<template>
  <div>
    <ui-textarea
      :model-value="data.description"
      class="w-full"
      :placeholder="t('common.description')"
      @change="updateData({ description: $event })"
    />
    <edit-autocomplete class="mt-2" trigger-class="!flex items-end">
      <ui-input
        :model-value="data.selector"
        class="mr-2 flex-1"
        autocomplete="off"
        label="Target element (Optional)"
        placeholder="CSS Selector or XPath"
        @change="updateData({ selector: $event })"
      />
      <shared-el-selector-actions
        :selector="data.selector"
        @update:selector="updateData({ selector: $event })"
      />
    </edit-autocomplete>
    <ui-select
      :model-value="data.action || 'press-key'"
      :label="t('workflow.blocks.base.action')"
      class="mt-2 w-full"
      @change="updateData({ action: $event })"
    >
      <option
        v-for="action in ['press-key', 'multiple-keys']"
        :key="action"
        :value="action"
      >
        {{ t(`workflow.blocks.press-key.actions.${action}`) }}
      </option>
    </ui-select>
    <div
      v-if="!data.action || data.action === 'press-key'"
      class="flex items-end"
    >
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
    <ui-textarea
      v-else
      :model-value="data.keysToPress"
      class="mt-2 w-full"
      placeholder="keys"
      @change="updateData({ keysToPress: $event })"
    />
    <ui-input
      :model-value="Math.min(data.pressTime || 0, 0)"
      :label="t('workflow.blocks.press-key.press-time')"
      type="number"
      class="w-full mt-2"
      :placeholder="t('common.millisecond')"
      @change="updateData({ pressTime: +$event })"
    />
  </div>
</template>
<script setup>
import { ref, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { keyDefinitions } from '@/utils/USKeyboardLayout';
import { recordPressedKey } from '@/utils/recordKeys';
import SharedElSelectorActions from '@/components/newtab/shared/SharedElSelectorActions.vue';
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
  event.preventDefault();
  event.stopPropagation();

  recordPressedKey(event, (keys) => {
    updateKeys(keys.join('+'));
  });
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
