<template>
  <div>
    <div class="mb-2 flex items-center">
      <ui-input
        :model-value="getReadableShortcut(recordKeys.keys)"
        readonly
        class="mr-2 flex-1"
        :placeholder="t('workflow.blocks.trigger.forms.shortcut')"
      />
      <ui-button
        v-tooltip="
          t(
            `workflow.blocks.trigger.shortcut.${
              recordKeys.isRecording ? 'stopRecord' : 'tooltip'
            }`
          )
        "
        icon
        @click="toggleRecordKeys"
      >
        <v-remixicon
          :name="recordKeys.isRecording ? 'riStopLine' : 'riRecordCircleLine'"
        />
      </ui-button>
    </div>
    <ui-checkbox
      :model-value="data.activeInInput"
      class="mb-1"
      :title="t('workflow.blocks.trigger.shortcut.checkboxTitle')"
      @change="$emit('update', { activeInInput: $event })"
    >
      {{ t('workflow.blocks.trigger.shortcut.checkbox') }}
    </ui-checkbox>
    <p class="mt-4 leading-tight text-gray-600 dark:text-gray-200">
      {{ t('workflow.blocks.trigger.shortcut.note') }}
    </p>
  </div>
</template>
<script setup>
import { reactive, onBeforeUnmount, onDeactivated } from 'vue';
import { useI18n } from 'vue-i18n';
import { recordShortcut } from '@/utils/recordKeys';
import { getReadableShortcut } from '@/composable/shortcut';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();

const recordKeys = reactive({
  isRecording: false,
  keys: `${props.data.shortcut}`,
});

function onKeydown(event) {
  event.preventDefault();
  event.stopPropagation();

  recordShortcut(event, (keys) => {
    recordKeys.keys = keys.join('+');
    emit('update', { shortcut: recordKeys.keys });
  });
}
function attachKeyEvents() {
  window.addEventListener('keydown', onKeydown);
  /* eslint-disable-next-line */
  window.addEventListener('keyup', detachKeyEvents);
}
function detachKeyEvents() {
  recordKeys.isRecording = false;

  window.removeEventListener('keydown', onKeydown);
  window.removeEventListener('keyup', detachKeyEvents);
}
function toggleRecordKeys() {
  recordKeys.isRecording = !recordKeys.isRecording;

  if (recordKeys.isRecording) {
    attachKeyEvents();
  } else {
    detachKeyEvents();
  }
}

onDeactivated(detachKeyEvents);
onBeforeUnmount(detachKeyEvents);
</script>
