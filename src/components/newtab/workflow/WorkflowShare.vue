<template>
  <ui-card class="w-full max-w-2xl share-workflow overflow-auto scroll">
    <template v-if="!userStore.user?.username">
      <div class="flex items-center mb-12">
        <p>{{ t('workflow.share.title') }}</p>
        <div class="flex-grow"></div>
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
      <div v-if="!isUpdate" class="flex items-center mb-4">
        <p>{{ t('workflow.share.title') }}</p>
        <div class="flex-grow"></div>
        <ui-button class="mr-2" @click="$emit('close')">
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button
          :loading="state.isPublishing"
          variant="accent"
          @click="publishWorkflow"
        >
          {{ t('workflow.share.publish') }}
        </ui-button>
      </div>
      <slot name="prepend"></slot>
      <div class="flex mb-4">
        <input
          v-model="state.workflow.name"
          :placeholder="t('workflow.name')"
          type="text"
          name="workflow name"
          class="font-semibold leading-none text-2xl focus:ring-0 block w-full bg-transparent mr-4 flex-1"
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
          class="w-full h-32 scroll resize-none"
        />
        <p
          class="text-sm text-gray-600 dark:text-gray-200 absolute bottom-2 right-2"
        >
          {{ state.workflow.description.length }}/300
        </p>
      </div>
      <shared-wysiwyg
        v-model="state.workflow.content"
        :placeholder="t('common.description')"
        :limit="5000"
        class="prose prose-zinc dark:prose-invert max-w-none content-editor p-4 bg-box-transparent rounded-lg relative"
        @count="state.contentLength = $event"
      >
        <template #append>
          <p
            class="text-sm text-gray-600 dark:text-gray-200 absolute bottom-2 right-2"
          >
            {{ state.contentLength }}/5000
          </p>
        </template>
      </shared-wysiwyg>
    </template>
  </ui-card>
</template>
<script setup>
import { reactive, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
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

watch(
  () => state.workflow,
  debounce(() => {
    emit('change', state.workflow);
  }, 200),
  { deep: true }
);
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
