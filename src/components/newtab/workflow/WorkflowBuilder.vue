<template>
  <div id="drawflow" @drop="dropHandler" @dragover.prevent></div>
</template>
<script>
import { onMounted, shallowRef } from 'vue';
import drawflow from '@/lib/drawflow';

export default {
  setup() {
    const editor = shallowRef(null);

    function dropHandler({ dataTransfer, clientX, clientY }) {
      const block = JSON.parse(dataTransfer.getData('block') || null);

      if (!block) return;
      console.log(block);

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
        1,
        1,
        xPosition,
        yPosition,
        block.id,
        { id: block.id, name: block.name },
        block.component,
        'vue'
      );
    }

    onMounted(() => {
      const element = document.querySelector('#drawflow');

      editor.value = drawflow(element);
    });

    return {
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
