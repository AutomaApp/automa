<template>
  <div
    id="drawflow"
    class="parent-drawflow relative"
    @drop="dropHandler"
    @dragover.prevent
  >
    <slot></slot>
    <div class="absolute z-10 p-4 bottom-0 left-0">
      <button
        v-tooltip.group="t('workflow.editor.resetZoom')"
        class="p-2 rounded-lg bg-white mr-2"
        @click="editor.zoom_reset()"
      >
        <v-remixicon name="riFullscreenLine" />
      </button>
      <div class="rounded-lg bg-white inline-block">
        <button
          v-tooltip.group="t('workflow.editor.zoomOut')"
          class="p-2 rounded-lg relative z-10"
          @click="editor.zoom_out()"
        >
          <v-remixicon name="riSubtractLine" />
        </button>
        <hr class="h-6 border-r inline-block" />
        <button
          v-tooltip.group="t('workflow.editor.zoomIn')"
          class="p-2 rounded-lg"
          @click="editor.zoom_in()"
        >
          <v-remixicon name="riAddLine" />
        </button>
      </div>
    </div>
    <ui-popover
      v-model="contextMenu.show"
      :options="contextMenu.position"
      padding="p-3"
    >
      <ui-list class="w-36 space-y-1">
        <ui-list-item
          v-for="item in contextMenu.items"
          :key="item.id"
          v-close-popover
          class="cursor-pointer"
          @click="contextMenuHandler[item.event]"
        >
          <v-remixicon :name="item.icon" class="mr-2 -ml-1" />
          <span>{{ item.name }}</span>
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </div>
</template>
<script>
/* eslint-disable camelcase */
import { onMounted, shallowRef, reactive, getCurrentInstance } from 'vue';
import emitter from 'tiny-emitter/instance';
import { useI18n } from 'vue-i18n';
import { tasks } from '@/utils/shared';
import { useGroupTooltip } from '@/composable/groupTooltip';
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
    useGroupTooltip();
    const { t } = useI18n();

    const contextMenuItems = {
      block: [
        {
          id: 'duplicate',
          name: t('workflow.editor.duplicate'),
          icon: 'riFileCopyLine',
          event: 'duplicateBlock',
        },
        {
          id: 'delete',
          name: t('common.delete'),
          icon: 'riDeleteBin7Line',
          event: 'deleteBlock',
        },
      ],
    };

    const editor = shallowRef(null);
    const contextMenu = reactive({
      items: [],
      data: null,
      show: false,
      position: {},
    });

    function dropHandler({ dataTransfer, clientX, clientY }) {
      const block = JSON.parse(dataTransfer.getData('block') || null);

      if (!block) return;

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
    function deleteBlock() {
      editor.value.removeNodeId(contextMenu.data);
    }
    function duplicateBlock() {
      const { name, pos_x, pos_y, data, html } = editor.value.getNodeFromId(
        contextMenu.data.substr(5)
      );

      if (name === 'trigger') return;

      const { outputs, inputs } = tasks[name];

      editor.value.addNode(
        name,
        inputs,
        outputs,
        pos_x + 50,
        pos_y + 100,
        name,
        data,
        html,
        'vue'
      );
    }

    onMounted(() => {
      const context = getCurrentInstance().appContext.app._context;
      const element = document.querySelector('#drawflow');

      editor.value = drawflow(element, { context, options: { reroute: true } });
      editor.value.start();

      emit('load', editor.value);

      if (props.data) {
        const data =
          typeof props.data === 'string'
            ? JSON.parse(props.data.replace(/BlockNewTab/g, 'BlockBasic'))
            : props.data;

        editor.value.import(data);
      } else {
        editor.value.addNode(
          'trigger',
          0,
          1,
          50,
          300,
          'trigger',
          tasks.trigger.data,
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
      editor.value.on('contextmenu', ({ clientY, clientX, target }) => {
        const isBlock = target.closest('.drawflow .drawflow-node');

        if (isBlock) {
          const virtualEl = {
            getReferenceClientRect: () => ({
              width: 0,
              height: 0,
              top: clientY,
              right: clientX,
              bottom: clientY,
              left: clientX,
            }),
          };

          contextMenu.data = isBlock.id;
          contextMenu.position = virtualEl;
          contextMenu.items = contextMenuItems.block;
          contextMenu.show = true;
        }
      });

      setTimeout(() => {
        editor.value.zoom_refresh();
      }, 500);
    });

    return {
      t,
      editor,
      contextMenu,
      dropHandler,
      contextMenuHandler: {
        deleteBlock,
        duplicateBlock,
      },
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
