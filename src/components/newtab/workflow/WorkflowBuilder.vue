<template>
  <div
    id="drawflow"
    class="parent-drawflow relative"
    @drop="dropHandler"
    @dragover.prevent="handleDragOver"
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
      <ui-list class="space-y-1 w-52">
        <ui-list-item
          v-for="item in contextMenu.items"
          :key="item.id"
          v-close-popover
          class="cursor-pointer justify-between"
          @click="contextMenuHandler[item.event]"
        >
          <span>
            {{ item.name }}
          </span>
          <span
            v-if="item.shortcut"
            class="text-sm capitalize text-gray-600 dark:text-gray-200"
          >
            {{ item.shortcut }}
          </span>
        </ui-list-item>
      </ui-list>
    </ui-popover>
  </div>
</template>
<script>
/* eslint-disable camelcase */
import { onMounted, shallowRef, reactive, getCurrentInstance } from 'vue';
import { useI18n } from 'vue-i18n';
import { compare } from 'compare-versions';
import defu from 'defu';
import emitter from '@/lib/mitt';
import { useShortcut, getShortcut } from '@/composable/shortcut';
import { tasks } from '@/utils/shared';
import { parseJSON } from '@/utils/helper';
import { useGroupTooltip } from '@/composable/groupTooltip';
import drawflow from '@/lib/drawflow';

export default {
  props: {
    data: {
      type: [Object, String],
      default: null,
    },
    version: {
      type: String,
      default: '',
    },
  },
  emits: ['load', 'deleteBlock', 'update', 'save'],
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
          shortcut: getShortcut('editor:duplicate-block').readable,
        },
        {
          id: 'delete',
          name: t('common.delete'),
          icon: 'riDeleteBin7Line',
          event: 'deleteBlock',
          shortcut: 'Del',
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

    const prevSelectedEl = {
      output: null,
      connection: null,
    };
    const isOutputEl = (el) => el.classList.contains('output');
    const isConnectionEl = (el) =>
      el.matches('path.main-path') ||
      el.parentElement.classList.contains('connection');

    function toggleHoverClass({ target, name, active, classes }) {
      const prev = prevSelectedEl[name];

      if (active) {
        if (prev === target) return;

        target.classList.toggle(classes, true);
      } else if (prev) {
        prev.classList.toggle(classes, false);
      }

      prevSelectedEl[name] = target;
    }
    function handleDragOver({ target }) {
      toggleHoverClass({
        target,
        name: 'connection',
        classes: 'selected',
        active: isConnectionEl(target),
      });
      toggleHoverClass({
        target,
        name: 'output',
        classes: 'ring-4',
        active: isOutputEl(target),
      });
    }
    function dropHandler({ dataTransfer, clientX, clientY, target }) {
      const block = JSON.parse(dataTransfer.getData('block') || null);

      if (!block || block.fromBlockBasic) return;

      const isTriggerExists =
        block.id === 'trigger' &&
        editor.value.getNodesFromName('trigger').length !== 0;

      if (isTriggerExists) return;

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

      const blockId = editor.value.addNode(
        block.id,
        block.inputs,
        block.outputs,
        xPosition + 25,
        yPosition - 25,
        block.id,
        block.data,
        block.component,
        'vue'
      );

      if (block.fromGroup) {
        const blockEl = document.getElementById(`node-${blockId}`);

        blockEl.setAttribute('group-item-id', block.itemId);
      }

      if (isConnectionEl(target)) {
        target.classList.remove('selected');

        const classes = target.parentElement.classList.toString();
        const result = {};
        const items = [
          { str: 'node_in_', key: 'inputId' },
          { str: 'input_', key: 'inputClass' },
          { str: 'node_out_', key: 'outputId' },
          { str: 'output_', key: 'outputClass' },
        ];

        items.forEach(({ key, str }) => {
          result[key] = classes
            .match(new RegExp(`${str}[^\\s]*`))[0]
            ?.replace(/node_in_node-|node_out_node-/, '');
        });

        try {
          editor.value.removeSingleConnection(
            result.outputId,
            result.inputId,
            result.outputClass,
            result.inputClass
          );
          editor.value.addConnection(
            result.outputId,
            blockId,
            result.outputClass,
            'input_1'
          );
          editor.value.addConnection(
            blockId,
            result.inputId,
            'output_1',
            result.inputClass
          );
        } catch (error) {
          // Do nothing
        }
      } else if (isOutputEl(target)) {
        prevSelectedEl.output?.classList.remove('ring-4');

        const targetBlockId = target
          .closest('.drawflow-node')
          .id.replace(/node-/, '');
        const outputClass = target.classList[1];
        const blockData = editor.value.getNodeFromId(targetBlockId);
        const { connections } = blockData.outputs[outputClass];

        if (connections[0]) {
          const { output, node } = connections[0];

          editor.value.removeSingleConnection(
            targetBlockId,
            node,
            outputClass,
            output
          );
        }

        editor.value.addConnection(
          targetBlockId,
          blockId,
          outputClass,
          'input_1'
        );
      }

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
    function duplicateBlock(id) {
      const { name, pos_x, pos_y, data, html } = editor.value.getNodeFromId(
        id || contextMenu.data.substr(5)
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

    useShortcut('editor:duplicate-block', () => {
      const selectedElement = document.querySelector('.drawflow-node.selected');

      if (!selectedElement) return;

      duplicateBlock(selectedElement.id.substr(5));
    });

    onMounted(() => {
      const context = getCurrentInstance().appContext.app._context;
      const element = document.querySelector('#drawflow');

      editor.value = drawflow(element, { context, options: { reroute: true } });
      editor.value.start();

      emit('load', editor.value);

      if (props.data) {
        let data =
          typeof props.data === 'string'
            ? parseJSON(props.data, null)
            : props.data;

        if (!data) return;

        const currentExtVersion = chrome.runtime.getManifest().version;
        const isOldWorkflow = compare(
          currentExtVersion,
          props.version || '0.0.0',
          '>'
        );

        if (isOldWorkflow) {
          const newDrawflowData = Object.entries(
            data.drawflow.Home.data
          ).reduce((obj, [key, value]) => {
            obj[key] = {
              ...value,
              html: tasks[value.name].component,
              data: defu({}, value.data, tasks[value.name].data),
            };

            return obj;
          }, {});

          data = {
            drawflow: { Home: { data: newDrawflowData } },
          };

          emit('update', { version: currentExtVersion });
        }

        editor.value.import(data);

        if (isOldWorkflow) {
          setTimeout(() => {
            emit('save');
          }, 200);
        }
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
      handleDragOver,
      contextMenuHandler: {
        deleteBlock,
        duplicateBlock: () => duplicateBlock(),
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
