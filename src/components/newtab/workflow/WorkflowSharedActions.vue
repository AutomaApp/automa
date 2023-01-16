<template>
  <ui-card padding="p-1">
    <ui-input
      v-tooltip="t('workflow.share.url')"
      prepend-icon="riLinkM"
      :model-value="`https://automa.site/workflow/${workflow.id}`"
      readonly
      @click="$event.target.select()"
    />
  </ui-card>
  <ui-card padding="p-1 ml-4">
    <button
      v-if="data.hasLocal"
      v-tooltip.group="t('workflow.share.fetchLocal')"
      class="hoverable rounded-lg p-2"
      @click="$emit('fetchLocal')"
    >
      <v-remixicon name="riRefreshLine" />
    </button>
    <button
      v-if="!data.hasLocal"
      v-tooltip.group="t('workflow.share.download')"
      class="hoverable rounded-lg p-2"
      @click="$emit('insertLocal')"
    >
      <v-remixicon name="riDownloadLine" />
    </button>
    <button
      v-tooltip.group="t('workflow.share.edit')"
      class="hoverable rounded-lg p-2"
      @click="state.showModal = true"
    >
      <v-remixicon name="riFileEditLine" />
    </button>
  </ui-card>
  <ui-card padding="p-1 flex ml-4">
    <button
      v-tooltip.group="t('workflow.share.unpublish')"
      class="hoverable relative mr-2 rounded-lg p-2"
      @click="$emit('unpublish')"
    >
      <ui-spinner
        v-if="data.isUnpublishing"
        color="text-accent"
        class="absolute top-2 left-2"
      />
      <v-remixicon
        name="riLock2Line"
        :class="{ 'opacity-75': data.isUnpublishing }"
      />
    </button>
    <ui-button
      :loading="data.isUpdating"
      :disabled="data.isUnpublishing"
      variant="accent"
      @click="$emit('save')"
    >
      <span
        v-if="data.isChanged"
        class="absolute top-0 left-0 -ml-1 -mt-1 flex h-3 w-3"
      >
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"
        ></span>
        <span
          class="relative inline-flex h-3 w-3 rounded-full bg-blue-600"
        ></span>
      </span>
      {{ t('workflow.share.update') }}
    </ui-button>
  </ui-card>
  <ui-modal v-model="state.showModal" custom-content @close="updateDescription">
    <workflow-share
      :workflow="workflow"
      is-update
      @change="onDescriptionUpdated"
    >
      <template #prepend>
        <div class="mb-6 flex justify-between">
          <p>{{ t('workflow.share.edit') }}</p>
          <v-remixicon
            name="riCloseLine"
            class="cursor-pointer"
            @click="
              state.showModal = false;
              updateDescription();
            "
          />
        </div>
      </template>
    </workflow-share>
  </ui-modal>
</template>
<script setup>
import { shallowReactive } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGroupTooltip } from '@/composable/groupTooltip';
import WorkflowShare from '@/components/newtab/workflow/WorkflowShare.vue';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
  data: {
    type: Object,
    default: () => ({}),
  },
});
const emit = defineEmits([
  'insertLocal',
  'fetchLocal',
  'update',
  'save',
  'unpublish',
]);

useGroupTooltip();
const { t } = useI18n();

const state = shallowReactive({
  showModal: false,
  isChanged: false,
  name: props.workflow.name,
  content: props.workflow.content,
  category: props.workflow.category,
  description: props.workflow.description,
});

function onDescriptionUpdated({ name, description, content, category }) {
  state.isChanged = true;

  state.name = name;
  state.content = content;
  state.category = category;
  state.description = description;
}
function updateDescription() {
  if (!state.isChanged) return;

  emit('update', {
    name: state.name,
    content: state.content,
    description: state.description,
  });
  state.isChanged = false;
}
</script>
