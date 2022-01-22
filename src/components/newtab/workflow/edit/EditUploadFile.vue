<template>
  <edit-interaction-base v-bind="{ data, hide: hideBase }" @change="updateData">
    <div class="mt-4 space-y-2">
      <div
        v-for="(path, index) in filePaths"
        :key="index"
        class="flex items-center group"
      >
        <ui-input
          v-model="filePaths[index]"
          :placeholder="t('workflow.blocks.upload-file.filePath')"
          class="mr-2"
        />
        <v-remixicon
          name="riDeleteBin7Line"
          class="invisible cursor-pointer group-hover:visible"
          @click="filePaths.splice(index, 1)"
        />
      </div>
    </div>
    <ui-button variant="accent" class="mt-2" @click="filePaths.push('')">
      {{ t('workflow.blocks.upload-file.addFile') }}
    </ui-button>
  </edit-interaction-base>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import { ref, watch } from 'vue';
import EditInteractionBase from './EditInteractionBase.vue';

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
  hideBase: {
    type: Boolean,
    default: false,
  },
});
const emit = defineEmits(['update:data']);

const { t } = useI18n();

const filePaths = ref([...props.data.filePaths]);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

watch(
  filePaths,
  (paths) => {
    updateData({ filePaths: paths });
  },
  { deep: true }
);
</script>
