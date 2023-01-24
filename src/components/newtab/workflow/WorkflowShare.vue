<template>
  <ui-card class="share-workflow scroll w-full max-w-2xl overflow-auto">
    <template v-if="!userStore.user?.username">
      <div class="mb-12 flex items-center">
        <p>{{ t('workflow.share.title') }}</p>
        <div class="grow"></div>
        <button @click="$emit('close')">
          <v-remixicon name="riCloseLine" />
        </button>
      </div>
      <p class="text-center">
        {{ t('auth.username') }}.
        <a
          class="underline"
          href="https://automa.site/profile?username=true"
          target="_blank"
        >
          {{ t('auth.clickHere') }}
        </a>
      </p>
    </template>
    <template v-else>
      <div v-if="!isUpdate" class="mb-4 flex items-center">
        <p>{{ t('workflow.share.title') }}</p>
        <div class="grow"></div>
        <ui-button class="mr-2" @click="$emit('close')">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button class="mr-2" @click="saveDraft"> Save draft </ui-button>
        <ui-button
          :loading="state.isPublishing"
          variant="accent"
          @click="publishWorkflow"
        >
          {{ t('workflow.share.publish') }}
        </ui-button>
      </div>
      <slot name="prepend"></slot>
      <div class="mb-4 flex">
        <input
          v-model="state.workflow.name"
          :placeholder="t('workflow.name')"
          type="text"
          name="workflow name"
          class="mr-4 block w-full flex-1 bg-transparent text-2xl font-semibold leading-none focus:ring-0"
        />
        <ui-select v-model="state.workflow.category">
          <option value="">{{ t('common.category') }} (none)</option>
          <option
            v-for="(category, id) in workflowCategories"
            :key="id"
            :value="id"
          >
            {{ category }}
          </option>
        </ui-select>
      </div>
      <div class="relative mb-2">
        <ui-textarea
          v-model="state.workflow.description"
          :max="300"
          placeholder="Short description"
          class="scroll h-32 w-full resize-none"
        />
        <p
          class="absolute bottom-2 right-2 text-sm text-gray-600 dark:text-gray-200"
        >
          {{ state.workflow.description.length }}/300
        </p>
      </div>
      <shared-wysiwyg
        v-model="state.workflow.content"
        :placeholder="t('common.description')"
        :limit="5000"
        class="content-editor bg-box-transparent prose prose-zinc relative max-w-none rounded-lg p-4 dark:prose-invert"
        @count="state.contentLength = $event"
      >
        <template #append>
          <p
            class="absolute bottom-2 right-2 text-sm text-gray-600 dark:text-gray-200"
          >
            {{ state.contentLength }}/5000
          </p>
        </template>
      </shared-wysiwyg>
    </template>
  </ui-card>
</template>
<script setup>
import { reactive, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import { fetchApi } from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useSharedWorkflowStore } from '@/stores/sharedWorkflow';
import { workflowCategories } from '@/utils/shared';
import { parseJSON, debounce } from '@/utils/helper';
import { convertWorkflow } from '@/utils/workflowData';
import SharedWysiwyg from '@/components/newtab/shared/SharedWysiwyg.vue';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
  isUpdate: Boolean,
});
const emit = defineEmits(['close', 'publish', 'change']);

const { t } = useI18n();
const toast = useToast();
const userStore = useUserStore();
const sharedWorkflowStore = useSharedWorkflowStore();

const state = reactive({
  contentLength: 0,
  isPublishing: false,
  workflow: JSON.parse(JSON.stringify(props.workflow)),
});

async function publishWorkflow() {
  try {
    state.isPublishing = true;

    const workflow = convertWorkflow(state.workflow, ['id', 'category']);
    workflow.name = workflow.name || 'unnamed';
    workflow.content = state.workflow.content || null;
    workflow.drawflow = parseJSON(workflow.drawflow, workflow.drawflow);
    workflow.description = state.workflow.description.slice(0, 300);

    delete workflow.extVersion;

    const response = await fetchApi('/me/workflows/shared', {
      auth: true,
      method: 'POST',
      body: JSON.stringify({ workflow }),
    });
    const result = await response.json();

    if (!response.ok) {
      const error = new Error(response.statusText);
      error.data = result.data;

      throw error;
    }

    workflow.drawflow = props.workflow.drawflow;

    sharedWorkflowStore.insert(workflow);
    sessionStorage.setItem(
      'shared-workflows',
      JSON.stringify(sharedWorkflowStore.shared)
    );

    state.isPublishing = false;

    emit('publish');
  } catch (error) {
    let errorMessage = t('message.somethingWrong');

    if (error.data && error.data.show) {
      errorMessage = error.message;
    }

    toast.error(errorMessage);
    console.error(error);

    state.isPublishing = false;
  }
}
function saveDraft() {
  const key = `draft:${props.workflow.id}`;
  browser.storage.local.set({
    [key]: {
      content: state.workflow.content,
      category: state.workflow.category,
      description: state.workflow.description,
    },
  });
}

watch(
  () => state.workflow,
  debounce(() => {
    emit('change', state.workflow);
  }, 200),
  { deep: true }
);

onMounted(() => {
  const key = `draft:${props.workflow.id}`;
  browser.storage.local.get(key).then((data) => {
    Object.assign(state.workflow, data[key]);
  });
});
</script>
<style scoped>
.share-workflow {
  min-height: 500px;
  max-height: calc(100vh - 4rem);
}
.editor-menu-btn {
  @apply p-1 rounded-md transition;
}
</style>
<style>
.content-editor .ProseMirror {
  min-height: 200px;
}
.content-editor .ProseMirror :first-child {
  margin-top: 0 !important;
}
</style>
