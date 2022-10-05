<template>
  <div class="inline-flex items-center">
    <ui-button
      v-tooltip.group="$t('workflow.blocks.base.element.select')"
      icon
      class="mr-2"
      @click="selectElement"
    >
      <v-remixicon name="riFocus3Line" />
    </ui-button>
    <ui-button
      v-tooltip.group="$t('workflow.blocks.base.element.verify')"
      :disabled="!selector"
      icon
      @click="verifySelector"
    >
      <v-remixicon name="riCheckDoubleLine" />
    </ui-button>
  </div>
</template>
<script setup>
import { useToast } from 'vue-toastification';
import { useGroupTooltip } from '@/composable/groupTooltip';
import elementSelector from '@/newtab/utils/elementSelector';

const props = defineProps({
  findBy: {
    type: String,
    default: null,
  },
  multiple: {
    type: Boolean,
    default: false,
  },
  selector: {
    type: String,
    default: '',
  },
});
const emit = defineEmits(['update:selector']);

useGroupTooltip();
const toast = useToast();

function selectElement() {
  elementSelector.selectElement().then((selector) => {
    emit('update:selector', selector);
  });
}
function verifySelector() {
  elementSelector
    .verifySelector({
      selector: props.selector,
      multiple: props.multiple,
      findBy: props.findBy,
    })
    .then((result) => {
      if (!result.notFound) return;

      toast.error('Element not found');
    });
}
</script>
