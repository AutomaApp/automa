<template>
  <ui-card class="w-full max-w-2xl share-workflow overflow-auto scroll">
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
      <template #prepend="{ editor }">
        <div
          class="p-2 rounded-lg backdrop-blur flex items-center sticky top-0 z-50 bg-box-transparent space-x-1 mb-2"
        >
          <button
            :class="{
              'bg-box-transparent text-primary': editor.isActive('heading', {
                level: 1,
              }),
            }"
            title="Heading 1"
            class="editor-menu-btn hoverable"
            @click="editor.commands.toggleHeading({ level: 1 })"
          >
            <v-remixicon name="riH1" />
          </button>
          <button
            :class="{
              'bg-box-transparent text-primary': editor.isActive('heading', {
                level: 2,
              }),
            }"
            title="Heading 2"
            class="editor-menu-btn hoverable"
            @click="editor.commands.toggleHeading({ level: 2 })"
          >
            <v-remixicon name="riH2" />
          </button>
          <span
            class="w-px h-5 bg-gray-300 dark:bg-gray-600"
            style="margin: 0 12px"
          ></span>
          <button
            v-for="item in menuItems"
            :key="item.id"
            :title="item.name"
            :class="{
              'bg-box-transparent text-primary': editor.isActive(item.id),
            }"
            class="editor-menu-btn hoverable"
            @click="editor.chain().focus()[item.action]().run()"
          >
            <v-remixicon :name="item.icon" />
          </button>
          <span
            class="w-px h-5 bg-gray-300 dark:bg-gray-600"
            style="margin: 0 12px"
          ></span>
          <button
            :class="{
              'bg-box-transparent text-primary': editor.isActive('blockquote'),
            }"
            title="Blockquote"
            class="editor-menu-btn hoverable"
            @click="editor.commands.toggleBlockquote()"
          >
            <v-remixicon name="riDoubleQuotesL" />
          </button>
          <button
            title="Insert image"
            class="editor-menu-btn hoverable"
            @click="insertImage(editor)"
          >
            <v-remixicon name="riImageLine" />
          </button>
          <button
            :class="{
              'bg-box-transparent text-primary': editor.isActive('link'),
            }"
            title="Link"
            class="editor-menu-btn hoverable"
            @click="setLink(editor)"
          >
            <v-remixicon name="riLinkM" />
          </button>
          <button
            v-show="editor.isActive('link')"
            title="Remove link"
            class="editor-menu-btn hoverable"
            @click="editor.commands.unsetLink()"
          >
            <v-remixicon name="riLinkUnlinkM" />
          </button>
        </div>
      </template>
      <template #append>
        <p
          class="text-sm text-gray-600 dark:text-gray-200 absolute bottom-2 right-2"
        >
          {{ state.contentLength }}/5000
        </p>
      </template>
    </shared-wysiwyg>
  </ui-card>
</template>
<script setup>
import { reactive, watch } from 'vue';
import { useStore } from 'vuex';
import { useI18n } from 'vue-i18n';
import { useToast } from 'vue-toastification';
import { fetchApi } from '@/utils/api';
import { workflowCategories } from '@/utils/shared';
import { parseJSON, debounce } from '@/utils/helper';
import { convertWorkflow } from '@/utils/workflow-data';
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
const store = useStore();

const menuItems = [
  { id: 'bold', name: 'Bold', icon: 'riBold', action: 'toggleBold' },
  { id: 'italic', name: 'Italic', icon: 'riItalic', action: 'toggleItalic' },
  {
    id: 'strike',
    name: 'Strikethrough',
    icon: 'riStrikethrough2',
    action: 'toggleStrike',
  },
];

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
    workflow.drawflow = parseJSON(workflow.drawflow, {});
    workflow.description = state.workflow.description.slice(0, 300);

    delete workflow.extVersion;

    const nodes = workflow.drawflow?.drawflow.Home.data;
    Object.keys(nodes).forEach((nodeId) => {
      if (nodes[nodeId].name !== 'loop-data') return;

      nodes[nodeId].data.loopData = '';
    });

    const response = await fetchApi('/workflow/publish', {
      method: 'POST',
      body: JSON.stringify({ workflow }),
    });
    const result = await response.json();

    if (response.status !== 200) {
      const error = new Error(response.statusText);
      error.data = result.data;

      throw error;
    }

    workflow.drawflow = props.workflow.drawflow;

    store.commit('updateStateNested', {
      path: `sharedWorkflows.${workflow.id}`,
      value: workflow,
    });
    sessionStorage.setItem(
      'shared-workflows',
      JSON.stringify(store.state.sharedWorkflows)
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
function setLink(editor) {
  const previousUrl = editor.getAttributes('link').href;
  const url = window.prompt('URL', previousUrl);

  if (url === null) return;

  if (url === '') {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();

    return;
  }

  editor
    .chain()
    .focus()
    .extendMarkRange('link')
    .setLink({ href: url, target: '_blank' })
    .run();
}
function insertImage(editor) {
  const url = window.prompt('URL');

  if (url) {
    editor.chain().focus().setImage({ src: url }).run();
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
