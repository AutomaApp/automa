<template>
  <div
    id="drawflow"
    class="parent-drawflow relative"
    @drop="dropHandler"
    @dragover.prevent
  >
    <div class="absolute p-4 bottom-0 left-0">
      <button class="p-2 rounded-lg bg-white mr-2" @click="editor.zoom_reset()">
        <v-remixicon name="riFullscreenLine" />
      </button>
      <div class="rounded-lg bg-white inline-block">
        <button class="p-2 rounded-lg relative z-10" @click="editor.zoom_out()">
          <v-remixicon name="riSubtractLine" />
        </button>
        <hr class="h-6 border-r inline-block" />
        <button class="p-2 rounded-lg" @click="editor.zoom_in()">
          <v-remixicon name="riAddLine" />
        </button>
      </div>
    </div>
  </div>
</template>
<script>
import { onMounted, onUnmounted, shallowRef } from 'vue';
import drawflow from '@/lib/drawflow';

export default {
  props: {
    data: {
      type: Object,
      default: null,
    },
  },
  emits: ['addBlock', 'deleteBlock', 'saveWorkflow'],
  setup(props, { emit }) {
    const editor = shallowRef(null);

    function dropHandler({ dataTransfer, clientX, clientY }) {
      const block = JSON.parse(dataTransfer.getData('block') || null);

      if (!block) return;

      const xPosition =
        clientX *
          (editor.value.precanvas.clientWidth /
            (editor.value.precanvas.clientWidth * editor.value.zoom)) -
        editor.value.precanvas.getBoundingClientRect().x *
          (editor.value.precanvas.clientWidth /
            (editor.value.precanvas.clientWidth * editor.value.zoom));
      const yPosition =
        clientY *
          (editor.value.precanvas.clientHeight /
            (editor.value.precanvas.clientHeight * editor.value.zoom)) -
        editor.value.precanvas.getBoundingClientRect().y *
          (editor.value.precanvas.clientHeight /
            (editor.value.precanvas.clientHeight * editor.value.zoom));

      editor.value.addNode(
        block.id,
        block.inputs,
        block.outputs,
        xPosition,
        yPosition,
        block.id,
        { id: block.id, name: block.name },
        block.component,
        'vue'
      );
    }
    function saveWorkflow() {
      emit('saveWorkflow', editor.value.export());
    }

    onMounted(() => {
      window.addEventListener('beforeunload', saveWorkflow);
      console.log(props, props.data.drawflow.Home.data);
      const element = document.querySelector('#drawflow');

      editor.value = drawflow(element);
      editor.value.start();

      if (props.data) {
        editor.value.import(props.data);
      } else {
        editor.value.addNode(
          'trigger',
          0,
          1,
          50,
          300,
          'trigger',
          {},
          'BlockBase',
          'vue'
        );
      }
    });
    onUnmounted(() => {
      saveWorkflow();
      window.removeEventListener('beforeunload', saveWorkflow);
    });

    return {
      editor,
      dropHandler,
    };
  },
};
</script>
<style>
#drawflow {
  background-image: url('@/assets/images/tile.png');
  background-size: 35px;
}
</style>
