<template>
  <ui-card
    v-if="userStore.user"
    class="pointer-events-auto space-x-1 mr-2"
    padding="p-1"
  >
    <ui-popover>
      <template #trigger>
        <ui-button
          :class="{ 'text-primary': isPkgShared }"
          icon
          type="transparent"
        >
          <v-remixicon name="riShareLine" />
        </ui-button>
      </template>
      <div class="w-64">
        <div class="flex items-center">
          <p class="flex-1">Share package</p>
          <ui-spinner
            v-if="state.isSharing || state.isLoadData"
            color="text-accent"
          />
          <ui-switch
            v-else
            v-tooltip:bottom="
              isPkgShared ? 'Unpublish package' : 'Share package'
            "
            :model-value="isPkgShared"
            @change="toggleSharePackage"
          />
        </div>
        <transition-expand>
          <ui-input
            v-if="isPkgShared"
            :model-value="`https://automa.site/packages/${data.id}`"
            readonly
            title="URL"
            type="url"
            class="w-full mt-2"
            @click="$event.target.select()"
          />
        </transition-expand>
      </div>
    </ui-popover>
  </ui-card>
  <ui-card class="pointer-events-auto flex items-center" padding="p-1">
    <ui-popover>
      <template #trigger>
        <ui-button icon type="transparent">
          <v-remixicon name="riMore2Line" />
        </ui-button>
      </template>
      <ui-list class="space-y-1" style="min-width: 9rem">
        <ui-list-item
          v-close-popover
          class="text-red-400 dark:text-red-500 cursor-pointer"
          @click="deletePackage"
        >
          <v-remixicon name="riDeleteBin7Line" class="mr-2 -ml-1" />
          <span>
            {{ t('common.delete') }}
          </span>
        </ui-list-item>
      </ui-list>
    </ui-popover>
    <ui-button
      :title="shortcuts['editor:save'].readable"
      :variant="isPkgShared ? 'default' : 'accent'"
      class="relative ml-1"
      @click="savePackage"
    >
      <span
        v-if="isDataChanged"
        class="flex h-3 w-3 absolute top-0 left-0 -ml-1 -mt-1"
      >
        <span
          class="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"
        ></span>
        <span
          class="relative inline-flex rounded-full h-3 w-3 bg-blue-600"
        ></span>
      </span>
      <v-remixicon name="riSaveLine" class="mr-2 -ml-1 my-1" />
      {{ $t('common.save') }}
    </ui-button>
    <ui-button
      v-if="isPkgShared"
      :loading="state.isUpdating"
      variant="accent"
      class="ml-4"
      @click="updateSharedPackage"
    >
      {{ $t('common.update') }}
    </ui-button>
  </ui-card>
</template>
<script setup>
import { onMounted, computed, reactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { useUserStore } from '@/stores/user';
import { usePackageStore } from '@/stores/package';
import { getShortcut, useShortcut } from '@/composable/shortcut';
import { useDialog } from '@/composable/dialog';
import { fetchApi } from '@/utils/api';

const props = defineProps({
  isDataChanged: {
    type: Boolean,
    default: false,
  },
  data: {
    type: Object,
    default: () => ({}),
  },
  editor: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits(['update']);

const { t } = useI18n();
const toast = useToast();
const dialog = useDialog();
const router = useRouter();
const userStore = useUserStore();
const packageStore = usePackageStore();
const shortcuts = useShortcut([
  /* eslint-disable-next-line */
  getShortcut('editor:save', savePackage),
]);

const state = reactive({
  isSharing: false,
  isUpdating: false,
  isLoadData: false,
});

const isPkgShared = computed(() => packageStore.isShared(props.data.id));

function deletePackage() {
  dialog.confirm({
    okVariant: 'danger',
    okText: 'Delete',
    title: 'Delete package',
    body: `Are you sure want to delete the "${props.data.name}" package?`,
    onConfirm: () => {
      packageStore.delete(props.data.id);
      router.replace('/packages');
    },
  });
}
function updatePackage(data = {}, changedIndicator = false) {
  return packageStore
    .update({
      data,
      id: props.data.id,
    })
    .then((result) => {
      emit('update', { data, changedIndicator });

      return result;
    });
}
function savePackage() {
  const flow = props.editor.toObject();
  flow.edges = flow.edges.map((edge) => {
    delete edge.sourceNode;
    delete edge.targetNode;

    return edge;
  });

  updatePackage({ data: flow }, false);
}
async function toggleSharePackage() {
  state.isSharing = true;

  try {
    if (!isPkgShared.value) {
      const keys = [
        'data',
        'description',
        'icon',
        'id',
        'content',
        'inputs',
        'outputs',
        'name',
        'settings',
      ];
      const payload = { extVersion: browser.runtime.getManifest().version };

      keys.forEach((key) => {
        payload[key] = props.data[key];
      });

      const response = await fetchApi('/packages', {
        method: 'POST',
        body: JSON.stringify({
          package: payload,
        }),
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.message);

      packageStore.insertShared(props.data.id);
    } else {
      const response = await fetchApi(`/packages/${props.data.id}`, {
        method: 'DELETE',
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.message);

      packageStore.deleteShared(props.data.id);
    }
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong');
  } finally {
    state.isSharing = false;
  }
}
async function updateSharedPackage() {
  try {
    state.isUpdating = true;

    const keys = [
      'data',
      'description',
      'icon',
      'content',
      'inputs',
      'outputs',
      'name',
      'settings',
    ];
    const payload = { extVersion: browser.runtime.getManifest().version };

    keys.forEach((key) => {
      payload[key] = props.data[key];
    });

    const response = await fetchApi(`/packages/${props.data.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ package: payload }),
    });
    const result = await response.json();

    if (!response.ok) throw new Error(result.message);
  } catch (error) {
    console.error(error);
    toast.error('Something went wrong!');
  } finally {
    state.isUpdating = false;
  }
}

onMounted(async () => {
  try {
    state.isLoadData = true;
    await packageStore.loadShared();
  } catch (error) {
    console.error(error);
  } finally {
    state.isLoadData = false;
  }
});
</script>
