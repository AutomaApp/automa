<template>
  <p v-if="recording.isChanged" class="text-gray-600 dark:text-gray-200 mb-4">
    {{ t('settings.language.reloadPage') }}
  </p>
  <div
    v-for="(items, category) in shortcutsCats"
    :key="category"
    class="mb-8 border p-4 rounded-lg dark:border-gray-800 border-gray-200"
  >
    <p class="font-semibold mb-2 capitalize">{{ category }}</p>
    <ui-list class="space-y-1 text-gray-600 dark:text-gray-200">
      <ui-list-item
        v-for="shortcut in items"
        :key="shortcut.id"
        class="group h-12"
      >
        <p class="flex-1 mr-4 capitalize">
          {{ shortcut.name }}
        </p>
        <template v-if="recording.id === shortcut.id">
          <kbd v-for="key in recording.keys" :key="key">
            {{ key }}
          </kbd>
          <button
            v-tooltip="t('common.cancel')"
            class="mr-2 ml-4"
            @click="cleanUp"
          >
            <v-remixicon name="riCloseLine" />
          </button>
          <button
            v-tooltip="t('workflow.blocks.trigger.shortcut.stopRecord')"
            @click="stopRecording"
          >
            <v-remixicon name="riStopLine" />
          </button>
        </template>
        <template v-else>
          <button
            v-tooltip="t('workflow.blocks.trigger.shortcut.tooltip')"
            class="group-hover:visible invisible"
            @click="startRecording(shortcut)"
          >
            <v-remixicon name="riRecordCircleLine" />
          </button>
          <kbd v-for="key in shortcut.keys" :key="key">
            {{ key }}
          </kbd>
        </template>
      </ui-list-item>
    </ui-list>
  </div>
</template>
<script setup>
import { ref, reactive, computed, onBeforeUnmount } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { mapShortcuts, getReadableShortcut } from '@/composable/shortcut';
import recordShortcut from '@/utils/record-shortcut';

const { t } = useI18n();
const toast = useToast();

const shortcuts = ref(mapShortcuts);
const recording = reactive({
  id: '',
  keys: [],
  isChanged: false,
});

const shortcutsCats = computed(() => {
  const arr = Object.values(shortcuts.value);
  const result = {};

  arr.forEach((item) => {
    const [category, shortcutName] = item.id.split(':');
    const readableKey = getReadableShortcut(item.combo);
    const name = shortcutName.replace('-', ' ');

    (result[category] = result[category] || []).push({
      ...item,
      name,
      keys: readableKey.split('+'),
    });
  });

  return result;
});

function keydownListener(event) {
  event.preventDefault();
  event.stopPropagation();

  if (!recording.id) {
    document.removeEventListener('keydown', keydownListener, true);
    return;
  }

  recordShortcut(event, (keys) => {
    recording.keys = keys;
  });
}
function cleanUp() {
  recording.id = '';
  recording.keys = [];

  document.removeEventListener('keydown', keydownListener, true);
}
function startRecording({ id }) {
  if (!recording.id) {
    document.addEventListener('keydown', keydownListener, true);
  }

  recording.keys = [];
  recording.id = id;
}
function stopRecording() {
  if (recording.keys.length === 0) return;

  const newCombo = recording.keys.join('+');
  const isDuplicate = Object.keys(shortcuts.value).find((key) => {
    return shortcuts.value[key].combo === newCombo && key !== recording.id;
  });

  if (isDuplicate) {
    toast.error(t('settings.shortcuts.duplicate', { name: isDuplicate }));

    return;
  }

  shortcuts.value[recording.id].combo = newCombo;
  cleanUp();

  recording.isChanged = true;

  localStorage.setItem('shortcuts', JSON.stringify(shortcuts.value));
}

onBeforeUnmount(() => {
  document.removeEventListener('keydown', keydownListener, true);
});
</script>
<style scoped>
kbd {
  min-width: 30px;
  text-align: center;
  text-transform: uppercase;
  @apply p-1 px-2 rounded-lg border text-sm shadow ml-1;
}
</style>
