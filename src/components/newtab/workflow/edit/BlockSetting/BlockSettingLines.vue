<template>
  <div class="block-lines max-w-xl">
    <ui-select
      v-model="state.activeEdge"
      :placeholder="t('workflow.blocks.base.settings.line.select')"
      class="w-full"
    >
      <option v-for="edge in state.edges" :key="edge.id" :value="edge.id">
        {{ edge.name }}
      </option>
    </ui-select>
    <div v-if="activeEdge" class="mt-4">
      <ui-input
        :model-value="activeEdge.label"
        :label="t('workflow.blocks.base.settings.line.label')"
        placeholder="A label"
        class="w-full"
        @change="updateActiveEdge('label', $event)"
      />
      <div class="flex items-center mt-4">
        <label class="flex items-center mr-4 block">
          <ui-switch
            :model-value="activeEdge.animated"
            @change="updateActiveEdge('animated', $event)"
          />
          <span class="ml-2">
            {{ t('workflow.blocks.base.settings.line.animated') }}
          </span>
        </label>
        <div class="w-32" />
        <label class="flex items-center">
          <input
            :value="activeEdge.style?.stroke ?? null"
            type="color"
            name="color"
            class="h-10 w-10 rounded-lg bg-input p-1"
            @input="updateActiveEdge('style', { stroke: $event.target.value })"
          />
          <span class="ml-2">
            {{ t('workflow.blocks.base.settings.line.lineColor') }}
          </span>
        </label>
      </div>
    </div>
  </div>
</template>
<script setup>
import { inject, onMounted, reactive, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { debounce } from '@/utils/helper';

const props = defineProps({
  blockId: {
    type: String,
    default: '',
  },
});

const { t } = useI18n();

const editor = inject('workflow-editor');
const state = reactive({
  retrieved: false,
  edges: {},
  activeEdge: '',
});

const activeEdge = computed(() => state.edges[state.activeEdge]);

const updateActiveEdge = debounce((name, value) => {
  const edge = editor.value.getEdge.value(state.activeEdge);

  edge[name] = value;
  state.edges[state.activeEdge][name] = value;
}, 250);

onMounted(() => {
  state.edges = editor.value.getEdges.value.reduce(
    (acc, { id, source, targetNode, label, animated, labelStyle, style }) => {
      if (source !== props.blockId) return acc;

      let name = t('workflow.blocks.base.settings.line.to', {
        name: t(`workflow.blocks.${targetNode.label}.name`),
      });
      if (targetNode.data.description) {
        name += ` (${targetNode.data.description.slice(0, 32)})`;
      }

      acc[id] = {
        name,
        id,
        label: `${label || ''}`,
        animated: animated ?? false,
        labelStyle: labelStyle || '',
      };

      if (style) acc[id].style = style;

      return acc;
    },
    {}
  );
});
</script>
