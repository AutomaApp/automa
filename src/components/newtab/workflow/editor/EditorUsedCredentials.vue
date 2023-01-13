<template>
  <ui-card
    v-if="credentials.length > 0"
    padding="p-1"
    class="pointer-events-auto mr-4"
  >
    <ui-popover v-tooltip="t('credential.use.title')" @show="checkCredentials">
      <template #trigger>
        <button class="hoverable rounded-lg p-2 transition">
          <v-remixicon name="riKey2Line" />
        </button>
      </template>
      <div class="w-64">
        <p class="leading-tight">
          {{ t('credential.use.description') }}
        </p>
        <ui-list class="scroll mt-2 overflow-auto" style="max-height: 400px">
          <ui-list-item
            v-for="item in credentials"
            :key="item.nodeId"
            style="align-items: flex-start"
            small
            class="group"
          >
            <div class="mr-2 flex-1">
              <p
                title="Jump to block"
                class="cursor-pointer text-sm text-gray-600 dark:text-gray-200"
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
              class="invisible cursor-pointer text-gray-600 group-hover:visible dark:text-gray-200"
              @click="jumpToBlock(item.nodeId)"
            />
          </ui-list-item>
        </ui-list>
      </div>
    </ui-popover>
  </ui-card>
</template>
<script setup>
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import objectPath from 'object-path';
import { getBlocks } from '@/utils/getSharedData';

const props = defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});

const blocks = getBlocks();

const { t } = useI18n();

const credentials = ref([]);

function checkCredentials() {
  const regex = /\{\{\s*secrets@(.*?)\}\}/;
  const tempCreds = [];

  props.editor.getNodes.value.forEach(({ label, id, data }) => {
    const keys = blocks[label]?.refDataKeys;
    if (!keys || !data) return;

    const usedCredentials = new Set();

    keys.forEach((key) => {
      const str = objectPath.get(data, key);
      const match = str?.match?.(regex);
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

onMounted(checkCredentials);
</script>
