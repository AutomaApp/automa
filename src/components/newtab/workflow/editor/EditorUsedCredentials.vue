<template>
  <ui-card
    v-if="credentials.length > 0"
    padding="p-1"
    class="pointer-events-auto mr-4"
  >
    <ui-popover v-tooltip="t('credential.use.title')" @show="checkCredentials">
      <template #trigger>
        <button class="p-2 hoverable transition">
          <v-remixicon name="riKey2Line" />
        </button>
      </template>
      <div class="w-64">
        <p class="leading-tight">
          {{ t('credential.use.description') }}
        </p>
        <ui-list class="mt-2 overflow-auto scroll" style="max-height: 400px">
          <ui-list-item
            v-for="item in credentials"
            :key="item.nodeId"
            style="align-items: flex-start"
            small
            class="group"
          >
            <div class="flex-1 mr-2">
              <p
                title="Jump to block"
                class="text-sm text-gray-600 dark:text-gray-200 cursor-pointer"
                @click="jumpToBlock(item.nodeId)"
              >
                {{ item.nodeName }}
              </p>
              <ul v-for="name in item.items" :key="name">
                <li :title="`Credential name: ${name}`">
                  <p class="text-overflow">- {{ name }}</p>
                </li>
              </ul>
            </div>
            <v-remixicon
              name="riArrowGoForwardLine"
              size="18"
              title="Jump to block"
              class="cursor-pointer text-gray-600 dark:text-gray-200 invisible group-hover:visible"
              @click="jumpToBlock(item.nodeId)"
            />
          </ui-list-item>
        </ui-list>
      </div>
    </ui-popover>
  </ui-card>
</template>
<script setup>
import { shallowRef } from 'vue';
import { useI18n } from 'vue-i18n';
import { tasks } from '@/utils/shared';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const { t } = useI18n();

const credentials = shallowRef([]);

function checkCredentials() {
  const regex = /\{\{\s*secrets@(.*?)\}\}/;
  const tempCreds = [];

  props.editor.getNodes.value.forEach(({ label, id, data }) => {
    const keys = tasks[label]?.refDataKeys;
    if (!keys) return;

    const usedCredentials = new Set();

    keys.forEach((key) => {
      const match = data[key]?.match(regex);
      if (!match || !match[1]) return;

      usedCredentials.add(match[1]);
    });

    if (usedCredentials.size > 0) {
      tempCreds.push({
        nodeId: id,
        items: Array.from(usedCredentials),
        nodeName: t(`workflow.blocks.${label}.name`),
      });
    }
  });

  credentials.value = tempCreds;
}
function jumpToBlock(nodeId) {
  const node = props.editor.getNode.value(nodeId);
  if (!node) return;

  const { x, y } = node.computedPosition;
  const editorContainer = document.querySelector('.vue-flow');
  const { width, height } = editorContainer.getBoundingClientRect();
  editorContainer.classList.add('add-transition');

  props.editor.setTransform({
    zoom: 1,
    x: -(x - width / 2),
    y: -(y - height / 2),
  });
  node.selected = true;

  setTimeout(() => {
    editorContainer.classList.remove('add-transition');
  }, 300);
}
</script>
