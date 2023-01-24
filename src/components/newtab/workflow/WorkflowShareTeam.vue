<template>
  <ui-card class="share-workflow scroll w-full max-w-4xl overflow-auto">
    <template v-if="!isUpdate">
      <h1 class="text-xl font-semibold">Share workflow with team</h1>
      <p class="text-gray-600 dark:text-gray-200">
        This workflow will be shared with your team
      </p>
    </template>
    <p v-else class="font-semibold">Update workflow</p>
    <div class="mt-4 flex items-start">
      <div class="mr-8 flex-1">
        <div class="flex items-center">
          <ui-input
            v-model="state.workflow.name"
            :label="t('workflow.name')"
            type="text"
            name="workflow name"
            class="flex-1"
          />
          <ui-select
            v-if="!isUpdate"
            v-model="state.activeTeam"
            label="Select team"
            class="ml-4"
            style="max-width: 220px"
          >
            <option
              v-for="team in state.userTeams"
              :key="team.id"
              :value="team.id"
            >
              {{ team.name }}
            </option>
          </ui-select>
        </div>
        <div class="relative my-2">
          <label
            for="short-description"
            class="ml-2 text-sm text-gray-600 dark:text-gray-200"
          >
            Short description
          </label>
          <ui-textarea
            id="short-description"
            v-model="state.workflow.description"
            :max="300"
            label="Short description"
            placeholder="Write here..."
            class="scroll h-28 w-full resize-none"
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
      </div>
      <div class="sticky top-4 w-64 pb-4">
        <template v-if="isUpdate">
          <ui-button
            variant="accent"
            class="w-full"
            @click="$emit('update', state.workflow)"
          >
            Save
          </ui-button>
          <ui-button class="mt-2 w-full" @click="$emit('close')">
            {{ t('common.cancel') }}
          </ui-button>
        </template>
        <template v-else>
          <div class="flex">
            <ui-button
              v-tooltip="'Save as draft'"
              :disabled="state.isPublishing"
              icon
              @click="saveDraft"
            >
              <v-remixicon name="riSaveLine" />
            </ui-button>
            <ui-button
              :loading="state.isPublishing"
              :disabled="!state.workflow.name.trim()"
              variant="accent"
              class="ml-2 w-full"
              @click="publishWorkflow"
            >
              Publish
            </ui-button>
          </div>
          <ui-button
            :disabled="state.isPublishing"
            class="mt-2 w-full"
            @click="$emit('close')"
          >
            Cancel
          </ui-button>
        </template>
        <ui-select
          v-model="state.workflow.category"
          class="mt-4 w-full"
          :label="t('common.category')"
        >
          <option value="">(none)</option>
          <option
            v-for="(category, id) in workflowCategories"
            :key="id"
            :value="id"
          >
            {{ category }}
          </option>
        </ui-select>
        <span class="ml-2 mt-5 block text-sm text-gray-600 dark:text-gray-200">
          Environment
        </span>
        <ui-tabs v-model="state.workflow.tag" type="fill" fill>
          <ui-tab value="stage"> Stage </ui-tab>
          <ui-tab value="production"> Production </ui-tab>
        </ui-tabs>
      </div>
    </div>
  </ui-card>
</template>
<script setup>
import { reactive, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import cloneDeep from 'lodash.clonedeep';
import { fetchApi } from '@/utils/api';
import { useUserStore } from '@/stores/user';
import { useTeamWorkflowStore } from '@/stores/teamWorkflow';
import { workflowCategories } from '@/utils/shared';
import { parseJSON, debounce } from '@/utils/helper';
import { convertWorkflow } from '@/utils/workflowData';
import { registerWorkflowTrigger } from '@/utils/workflowTrigger';
import SharedWysiwyg from '@/components/newtab/shared/SharedWysiwyg.vue';

const props = defineProps({
  workflow: {
    type: Object,
    default: () => ({}),
  },
  isUpdate: Boolean,
});
const emit = defineEmits(['close', 'publish', 'change', 'update']);

const { t } = useI18n();
const toast = useToast();
const userStore = useUserStore();
const teamWorkflowStore = useTeamWorkflowStore();

const state = reactive({
  userTeams: [],
  activeTeam: null,
  contentLength: 0,
  isPublishing: false,
  workflow: JSON.parse(JSON.stringify(props.workflow)),
});

async function publishWorkflow() {
  try {
    state.isPublishing = true;

    const workflow = convertWorkflow(state.workflow, ['id', 'category']);
    workflow.name = workflow.name || 'unnamed';
    workflow.tag = state.workflow.tag || 'stage';
    workflow.content = state.workflow.content || null;
    workflow.description = state.workflow.description.slice(0, 300);
    workflow.drawflow = parseJSON(workflow.drawflow, workflow.drawflow);

    delete workflow.extVersion;

    const response = await fetchApi(`/teams/${state.activeTeam}/workflows`, {
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

    workflow.id = result.id;
    workflow.teamId = result.teamId;
    workflow.createdAt = Date.now();
    workflow.drawflow = props.workflow.drawflow;

    await teamWorkflowStore.insert(state.activeTeam, cloneDeep(workflow));
    state.isPublishing = false;

    const triggerBlock = workflow.drawflow.nodes?.find(
      (node) => node.label === 'trigger'
    );
    if (triggerBlock) {
      await registerWorkflowTrigger(workflow.id, triggerBlock);
    }

    toast('Successfully share the workflow with your team');

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
  const key = `draft-team:${props.workflow.id}`;
  browser.storage.local.set({
    [key]: {
      name: state.workflow.name,
      tag: state.tag,
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
  if (!props.isUpdate) {
    const key = `draft-team:${props.workflow.id}`;
    browser.storage.local.get(key).then((data) => {
      Object.assign(state.workflow, data[key]);

      if (!state.workflow.tag) {
        state.workflow.tag = 'stage';
      }
    });

    state.userTeams = userStore.user.teams.filter((team) =>
      team.access.some((item) => ['owner', 'create'].includes(item))
    );
    if (state.userTeams[0]) state.activeTeam = state.userTeams[0].id;
  }
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
