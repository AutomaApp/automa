<template>
  <div
    id="drawflow"
    class="parent-drawflow relative"
    @drop="dropHandler"
    @dragover.prevent
  >
    <div class="absolute z-10 p-4 bottom-0 left-0">
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
/* eslint-disable camelcase */
import { onMounted, shallowRef, getCurrentInstance } from 'vue';
import emitter from 'tiny-emitter/instance';
import { tasks } from '@/utils/shared';
import drawflow from '@/lib/drawflow';

export default {
  props: {
    data: {
      type: [Object, String],
      default: null,
    },
  },
  emits: ['load', 'deleteBlock'],
  setup(props, { emit }) {
    const editor = shallowRef(null);

    function dropHandler({ dataTransfer, clientX, clientY }) {
      const block = JSON.parse(dataTransfer.getData('block') || null);
      const isTriggerExists =
        block.id === 'trigger' &&
        editor.value.getNodesFromName('trigger').length !== 0;

      if (!block || isTriggerExists) return;

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
        block.data,
        block.component,
        'vue'
      );
      emitter.emit('editor:data-changed');
    }
    function isInputAllowed(allowedInputs, input) {
      if (typeof allowedInputs === 'boolean') return allowedInputs;

      return allowedInputs.some((item) => {
        if (item.startsWith('#')) {
          return tasks[input].category === item.substr(1);
        }

        return item === input;
      });
    }

    onMounted(() => {
      const element = document.querySelector('#drawflow', getCurrentInstance());

      editor.value = drawflow(element);
      editor.value.start();

      emit('load', editor.value);

      if (props.data) {
        /* to-do delete replace method */
        const data =
          typeof props.data === 'string' ? JSON.parse(props.data) : props.data;

        editor.value.import(data);
      } else {
        editor.value.addNode(
          'trigger',
          0,
          1,
          50,
          300,
          'trigger',
          { type: 'manual' },
          'BlockBasic',
          'vue'
        );
      }

      editor.value.on('nodeRemoved', (id) => {
        emit('deleteBlock', id);
      });
      editor.value.on(
        'connectionCreated',
        ({ output_id, input_id, output_class, input_class }) => {
          const { outputs } = editor.value.getNodeFromId(output_id);
          const { name: inputName } = editor.value.getNodeFromId(input_id);
          const { allowedInputs, maxConnection } = tasks[inputName];
          const isAllowed = isInputAllowed(allowedInputs, inputName);
          const isMaxConnections =
            outputs[output_class]?.connections.length > maxConnection;

          if (!isAllowed || isMaxConnections) {
            editor.value.removeSingleConnection(
              output_id,
              input_id,
              output_class,
              input_class
            );
          }

          emitter.emit('editor:data-changed');
        }
      );
      editor.value.on('connectionRemoved', () => {
        emitter.emit('editor:data-changed');
      });
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
