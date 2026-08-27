<template>
  <div>
    <ui-button
      variant="accent"
      class="text-sm w-full"
      @click="state.showAIPowerTokenModal = true"
    >
      <span class="flex justify-between items-center w-full">
        <span class="flex items-center space-x-1">
          <v-remixicon name="riKey" size="16"></v-remixicon>
          <span>{{ t('workflow.blocks.ai-workflow.configureToken') }}</span>
        </span>
        <v-remixicon name="riArrowRightLine" size="16"></v-remixicon>
      </span>
    </ui-button>

    <template v-if="aiPowerToken">
      <ui-paginated-select
        :key="aiPowerToken"
        :model-value="data.flowUuid"
        :initial-label="data.flowLabel"
        :load-options="loadWorkflows"
        option-value-key="flowUuid"
        option-label-key="name"
        class="mt-4 w-full"
        :label="t('workflow.blocks.ai-workflow.selectWorkflows')"
        :placeholder="t('workflow.blocks.ai-workflow.selectWorkflow')"
        :search-placeholder="t('workflow.blocks.ai-workflow.searchWorkflows')"
        @change="onFlowChange"
      >
        <template #footer>
          <ui-button class="w-full" @click="createNewWorkflow">
            <v-remixicon name="riAddLine" class="mr-2" />
            {{ t('workflow.blocks.ai-workflow.newWorkflow') }}
          </ui-button>
        </template>
      </ui-paginated-select>

      <div
        class="w-full my-6 relative flex items-center justify-center bg-[#e4e4e7] h-[1px]"
      ></div>

      <div class="my-4">
        <p class="font-semibold">{{ t('workflow.blocks.ai-workflow.inputs') }}</p>
        <template v-if="data.inputs && data.inputs.length">
          <div
            v-for="(item, index) in data.inputs"
            :key="`${data.flowUuid}-${item.name}`"
          >
            <component
              :is="getComponent(item.type)"
              :label="`${item.label} (${item.type})`"
              :placeholder="item.name || null"
              :model-value="item.value"
              :accept="item.accept"
              :max-size="item.maxSize"
              :on-upload="handleUploadFile"
              class="w-full my-2"
              @change="onInputParamsChange(item, index, $event)"
            />
          </div>
        </template>
        <template v-else>
          <p class="text-sm text-gray-500">
            {{ t('workflow.blocks.ai-workflow.noInputs') }}
          </p>
        </template>
      </div>

      <div class="my-4">
        <p class="font-semibold">
          {{ t('workflow.blocks.ai-workflow.outputsReadonly') }}
        </p>
        <template v-if="data.outputs && data.outputs.length">
          <ui-input
            v-for="(item, index) in data.outputs"
            :key="index"
            :label="`${item.label} (${item.type})`"
            :placeholder="item.name || null"
            readonly
            class="w-full my-2"
          />
        </template>
        <template v-else>
          <p class="text-sm text-gray-500">
            {{ t('workflow.blocks.ai-workflow.noOutputs') }}
          </p>
        </template>
      </div>

      <div class="my-4">
        <insert-workflow-data :data="data" variables @update="updateData" />
      </div>

      <span class="text-sm text-gray-500 block text-center mt-10"
        >Powered by Automa
        <a href="https://aipower.automa.site/">AI Power</a></span
      >
    </template>

    <ui-modal
      v-model="state.showAIPowerTokenModal"
      :title="t('workflow.blocks.ai-workflow.configureToken')"
    >
      <div class="mb-6">
        <p>
          <span class="text-gray-500 text-[14px] leading-[24px]">
            {{ t('workflow.blocks.ai-workflow.tokenIntro') }}
          </span>
        </p>
      </div>

      <div
        class="bg-[#f2f2f2] dark:bg-gray-900 mb-6 p-6 rounded-lg w-full space-y-4"
      >
        <p
          class="font-semibold text-[16px] dark:text-gray-300 leading-[24px] flex items-center"
        >
          <v-remixicon name="riKey" size="16" class="mr-1"></v-remixicon>
          {{ t('workflow.blocks.ai-workflow.howToGetToken') }}
        </p>

        <ol
          class="space-y-2 list-decimal list-inside text-sm text-gray-600 dark:text-gray-400"
        >
          <li>{{ t('workflow.blocks.ai-workflow.tokenStep1') }}</li>
          <li>{{ t('workflow.blocks.ai-workflow.tokenStep2') }}</li>
          <li>{{ t('workflow.blocks.ai-workflow.tokenStep3') }}</li>
          <li>{{ t('workflow.blocks.ai-workflow.tokenStep4') }}</li>
        </ol>

        <ui-button variant="default" @click="goToAIPowerSettings">
          <span class="text-[14px] leading-[24px]">
            {{ t('workflow.blocks.ai-workflow.openSettings') }}
          </span>
          <v-remixicon name="riArrowRightUpLine" size="16"></v-remixicon>
        </ui-button>
      </div>

      <div class="flex flex-col space-y-4 mb-4">
        <span class="text-sm text-gray-500 font-semibold">
          {{ t('workflow.blocks.ai-workflow.tokenLabel') }}
        </span>
        <ui-input
          :model-value="aiPowerToken"
          class="w-full"
          :placeholder="t('workflow.blocks.ai-workflow.tokenPlaceholder')"
          @change="updateAIPowerToken"
        />
      </div>

      <div class="flex justify-end space-x-2">
        <ui-button
          variant="default"
          @click="state.showAIPowerTokenModal = false"
        >
          {{ t('common.cancel') }}
        </ui-button>
        <ui-button variant="accent" @click="saveAIPowerToken">
          {{ t('common.save') }}
        </ui-button>
      </div>
    </ui-modal>
  </div>
</template>

<script setup>
import UiFileInput from '@/components/ui/UiFileInput.vue';
import UiInput from '@/components/ui/UiInput.vue';
import UiPaginatedSelect from '@/components/ui/UiPaginatedSelect.vue';
import { useWorkflowStore } from '@/stores/workflow';
import {
  getAPFlowList,
  getAPWorkflowDetail,
  postUploadFile,
} from '@/utils/getAIPoweredInfo';
import cloneDeep from 'lodash.clonedeep';
import secrets from 'secrets';
import {
  computed,
  defineEmits,
  defineProps,
  shallowReactive,
  watch,
} from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import browser from 'webextension-polyfill';
import InsertWorkflowData from './InsertWorkflowData.vue';

const { t } = useI18n();
const toast = useToast();

const props = defineProps({
  data: {
    type: Object,
    default: () => ({}),
  },
});

const emit = defineEmits(['update:data']);

function updateData(value) {
  emit('update:data', { ...props.data, ...value });
}

const getComponent = (type) => {
  const uploadTypes = ['VIDEO', 'IMAGE', 'AUDIO', 'FILE'];
  if (uploadTypes.includes(type)) {
    return UiFileInput;
  }
  return UiInput;
};

const state = shallowReactive({
  showAIPowerTokenModal: false,
});

const { id: workflowId } = useRoute().params;
const workflowStore = useWorkflowStore();
const currentWorkflow = workflowStore.getById(workflowId);

const aiPowerToken = computed(() => {
  return currentWorkflow?.settings?.aipowerToken;
});

const handleUploadFile = async (file) => {
  try {
    const res = await postUploadFile(file, aiPowerToken.value);
    if (res.success) {
      return {
        url: res.data.fileReadUrl,
        filename: file.name,
      };
    }
    throw new Error(res.msg || t('workflow.blocks.ai-workflow.uploadFailed'));
  } catch (error) {
    console.error(error);
    throw error;
  }
};

const createNewWorkflow = () => {
  browser.tabs.create({
    url: secrets.apCreateWorkflowUrl,
  });
};

const clearInputsAndOutputs = () => {
  updateData({
    inputs: [],
    outputs: [],
    flowUuid: '',
    flowLabel: '',
  });
};

const loadWorkflows = async ({ query, page }) => {
  try {
    const pageSize = 10;
    const res = await getAPFlowList(
      { page, size: pageSize, name: query },
      aiPowerToken.value
    );

    if (res.success) {
      return {
        data: res.data,
        hasMore: res.page.pages > res.page.page,
      };
    }
    toast.error(
      t('workflow.blocks.ai-workflow.fetchWorkflowsFailed', {
        message: res.msg,
      })
    );
    return { data: [], hasMore: false };
  } catch (err) {
    console.error(err);
    toast.error(`${err.message}`);
    return { data: [], hasMore: false };
  }
};
const goToAIPowerSettings = () => {
  const url = `${secrets.apHomeUrl}/authorization`;

  window.open(url, '_blank');
};

const updateAIPowerToken = (value) => {
  state.aipowerToken = value;
};

const saveAIPowerToken = () => {
  const oldToken = currentWorkflow.settings.aipowerToken;
  const newToken = state.aipowerToken;

  // Do nothing if token hasn't changed.
  if (newToken === oldToken) {
    state.showAIPowerTokenModal = false;
    return;
  }

  const newSettings = {
    ...currentWorkflow.settings,
    aipowerToken: newToken,
  };

  workflowStore.update({
    id: workflowId,
    data: {
      ...currentWorkflow,
      settings: newSettings,
    },
  });
  state.showAIPowerTokenModal = false;

  // When token changes, the previous selection is no longer valid.
  // Clearing it will also reset the inputs/outputs.
  // The UiPaginatedSelect component will re-initialize because its `key` has changed.
  clearInputsAndOutputs();
};

const onFlowChange = (value, label) => {
  updateData({ flowUuid: value, flowLabel: label });
};

const onInputParamsChange = (item, index, value) => {
  const newInputs = cloneDeep(props.data.inputs);
  newInputs[index].value = value;
  updateData({ inputs: newInputs });
};

watch(
  () => props.data.flowUuid,
  (newVal, oldVal) => {
    if (!newVal) {
      updateData({
        inputs: [],
        outputs: [],
      });
      return;
    }

    if (newVal === oldVal) return;

    getAPWorkflowDetail(newVal, aiPowerToken.value).then((res) => {
      if (res.success) {
        updateData({
          inputs: res.data.inputs,
          outputs: res.data.outputs,
        });
      } else {
        clearInputsAndOutputs();
        toast.error(
          t('workflow.blocks.ai-workflow.fetchDetailFailed', {
            message: res.msg,
          })
        );
      }
    });
  }
);
</script>
