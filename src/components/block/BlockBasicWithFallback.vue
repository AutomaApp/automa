<template>
  <block-basic v-slot="{ block }" :editor="editor" class="block-with-fallback">
    <div class="fallback flex items-center pb-2 justify-end">
      <v-remixicon
        v-if="block"
        :title="t(`workflow.blocks.${block.details.id}.fallback`)"
        name="riInformationLine"
        size="18"
      />
      <span class="ml-1">
        {{ t('common.fallback') }}
      </span>
    </div>
  </block-basic>
</template>
<script setup>
import { useI18n } from 'vue-i18n';
import BlockBasic from './BlockBasic.vue';

const { t } = useI18n();

defineProps({
  editor: {
    type: Object,
    default: () => ({}),
  },
});
</script>
<style>
.block-with-fallback .block-base__content {
  padding-bottom: 0;
}
.drawflow-node.webhook .outputs,
.drawflow-node.while-loop .outputs {
  top: 64%;
}
.drawflow-node.webhook .outputs .output_1,
.drawflow-node.while-loop .outputs .output_1 {
  margin-bottom: 14px;
}
</style>
