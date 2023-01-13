<template>
  <div class="mt-6 border-t pt-4">
    <div class="flex items-center text-gray-600 dark:text-gray-300">
      <span class="flex-1"> Folders </span>
      <button
        class="rounded-md transition hover:text-black dark:hover:text-gray-100"
        @click="newFolder"
      >
        <v-remixicon
          size="20"
          name="riAddLine"
          class="inline-block align-sub"
        />
        <span>{{ t('common.new') }}</span>
      </button>
    </div>
    <ui-list class="mt-2 space-y-1">
      <ui-list-item
        small
        class="cursor-pointer"
        :active="modelValue === ''"
        @dragover="onDragover($event, true)"
        @dragleave="onDragover($event, false)"
        @drop="onWorkflowsDrop($event, '')"
        @click="$emit('update:modelValue', '')"
      >
        <v-remixicon name="riFolderLine" class="mr-2" />
        <p class="text-overflow flex-1">All</p>
      </ui-list-item>
      <ui-list-item
        v-for="folder in folders"
        :key="folder.id"
        :active="folder.id === modelValue"
        small
        class="group cursor-pointer overflow-hidden"
        @dragover="onDragover($event, true)"
        @dragleave="onDragover($event, false)"
        @drop="onWorkflowsDrop($event, folder.id)"
        @click="$emit('update:modelValue', folder.id)"
      >
        <v-remixicon name="riFolderLine" class="mr-2" />
        <p class="text-overflow flex-1">
          {{ folder.name }}
        </p>
        <ui-popover class="leading-none">
          <template #trigger>
            <v-remixicon
              name="riMoreLine"
              class="invisible cursor-pointer group-hover:visible"
            />
          </template>
          <ui-list class="w-36 space-y-1">
            <ui-list-item
              v-close-popover
              class="cursor-pointer"
              @click="exportFolderWorkflows(folder.id)"
            >
              <v-remixicon name="riDownloadLine" class="mr-2 -ml-1" />
              <span>
                {{ t('common.export') }}
              </span>
            </ui-list-item>
            <ui-list-item
              v-close-popover
              class="cursor-pointer"
              @click="renameFolder(folder)"
            >
              <v-remixicon name="riPencilLine" class="mr-2 -ml-1" />
              <span>
                {{ t('common.rename') }}
              </span>
            </ui-list-item>
            <ui-list-item
              v-close-popover
              class="cursor-pointer"
              @click="deleteFolder(folder)"
            >
              <v-remixicon name="riDeleteBin7Line" class="mr-2 -ml-1" />
              <span>
                {{ t('common.delete') }}
              </span>
            </ui-list-item>
          </ui-list>
        </ui-popover>
      </ui-list-item>
    </ui-list>
  </div>
</template>
<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { useDialog } from '@/composable/dialog';
import { parseJSON } from '@/utils/helper';
import { useFolderStore } from '@/stores/folder';
import { useWorkflowStore } from '@/stores/workflow';
import { exportWorkflow } from '@/utils/workflowData';

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:modelValue']);

const { t } = useI18n();
const dialog = useDialog();
const folderStore = useFolderStore();
const workflowStore = useWorkflowStore();

const folders = computed(() => folderStore.items);

function exportFolderWorkflows(folderId) {
  const workflows = workflowStore.getWorkflows.filter(
    (item) => item.folderId === folderId
  );
  workflows.forEach((workflow) => {
    exportWorkflow(workflow);
  });
}
function onDragover(event, toggle) {
  const parent = event.target.closest('.ui-list-item');
  if (!parent) return;

  event.preventDefault();
  parent.classList.toggle('ring-2', toggle);
}
function newFolder() {
  dialog.prompt({
    title: t('workflows.folder.new'),
    placeholder: t('workflows.folder.name'),
    okText: t('common.add'),
    onConfirm(value) {
      if (!value || !value.trim()) return false;

      folderStore.addFolder(value);

      return true;
    },
  });
}
function deleteFolder({ name, id }) {
  dialog.confirm({
    title: t('workflows.folder.delete'),
    body: t('message.delete', { name }),
    okText: t('common.delete'),
    okVariant: 'danger',
    onConfirm() {
      folderStore.deleteFolder(id);

      emit('update:modelValue', '');
    },
  });
}
function renameFolder({ id, name }) {
  dialog.prompt({
    inputValue: name,
    okText: t('common.rename'),
    title: t('workflows.folder.rename'),
    placeholder: t('workflows.folder.name'),
    onConfirm(newName) {
      if (!newName || !newName.trim()) return false;

      folderStore.updateFolder(id, { name: newName });

      return true;
    },
  });
}
async function onWorkflowsDrop({ dataTransfer }, folderId) {
  const ids = parseJSON(dataTransfer.getData('workflows'), null);
  if (!ids || !Array.isArray(ids)) return;

  try {
    for (const id of ids) {
      await workflowStore.update({
        id,
        data: { folderId },
      });
    }
  } catch (error) {
    console.error(error);
  }
}
</script>
