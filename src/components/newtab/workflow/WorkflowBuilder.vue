<template>
  <div
    id="drawflow"
    :class="{ 'with-arrow': $store.state.settings.editor.arrow }"
    class="parent-drawflow relative"
    @drop="dropHandler"
    @dragover.prevent="handleDragOver"
  >
    <div
      class="flex items-end absolute w-full p-4 left-0 bottom-0 justify-between z-10"
    >
      <div id="zoom">
        <button
          v-tooltip.group="t('workflow.editor.resetZoom')"
          class="p-2 rounded-lg bg-white dark:bg-gray-800 mr-2"
          @click="editor.zoom_reset()"
        >
          <v-remixicon name="riFullscreenLine" />
        </button>
        <div class="rounded-lg bg-white dark:bg-gray-800 inline-block">
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
      <slot v-bind="{ editor }"></slot>
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
import {
  onMounted,
  shallowRef,
  reactive,
  getCurrentInstance,
  watch,
  onBeforeUnmount,
} from 'vue';
import { useStore } from 'vuex';
import { useRoute } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { compare } from 'compare-versions';
import defu from 'defu';
import SelectionArea from '@viselect/vanilla';
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
    isShared: {
      type: Boolean,
      default: false,
    },
    version: {
      type: [String, Boolean],
      default: '',
    },
    mode: {
      type: String,
      default: 'edit',
    },
  },
  emits: ['load', 'deleteBlock', 'update', 'save'],
  setup(props, { emit }) {
    useGroupTooltip();

    const { t } = useI18n();
    const route = useRoute();
    const store = useStore();

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

    let activeNode = null;
    let hasDragged = false;
    let isDragging = false;
    let selectedElements = [];

    const editor = shallowRef(null);
    const contextMenu = reactive({
      items: [],
      data: null,
      show: false,
      position: {},
    });

    const workflowId = route.params.id;

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
      const { name, pos_x, pos_y, data, html, inputs, outputs } =
        editor.value.getNodeFromId(id || contextMenu.data.substr(5));

      if (name === 'trigger') return;

      const { outputs: defOutputs, inputs: defInputs } = tasks[name];
      const blockInputs = Object.keys(inputs).length || defInputs;
      const blockOutputs = Object.keys(outputs).length || defOutputs;

      editor.value.addNode(
        name,
        blockInputs,
        blockOutputs,
        pos_x + 50,
        pos_y + 100,
        name,
        data,
        html,
        'vue'
      );
    }
    function checkWorkflowData() {
      if (!editor.value) return;

      editor.value.editor_mode = props.isShared ? 'fixed' : 'edit';
      editor.value.container.classList.toggle('is-shared', props.isShared);
    }
    function refreshConnection() {
      const nodes = document.querySelectorAll('#drawflow .drawflow-node');
      nodes.forEach((node) => {
        if (!node.id) return;

        editor.value.updateConnectionNodes(node.id);
      });
    }
    function saveEditorState() {
      const editorStates =
        parseJSON(localStorage.getItem('editor-states'), {}) || {};
      editorStates[workflowId] = {
        zoom: editor.value.zoom,
        canvas_x: editor.value.canvas_x,
        canvas_y: editor.value.canvas_y,
      };

      localStorage.setItem('editor-states', JSON.stringify(editorStates));
    }
    function initSelectArea() {
      const selection = new SelectionArea({
        container: '#drawflow',
        startareas: ['#drawflow'],
        boundaries: ['#drawflow'],
        selectables: ['.drawflow-node'],
        features: {
          singleTap: {
            allow: false,
          },
        },
      });

      selection.on('beforestart', ({ event }) => {
        if (!event.ctrlKey) return false;

        editor.value.editor_mode = 'fixed';
        editor.value.editor_selected = false;

        return true;
      });
      selection.on('move', () => {
        hasDragged = true;
      });
      selection.on('stop', (event) => {
        event.store.selected.forEach((el) => {
          const isExists = selectedElements.some((item) =>
            item.el.isEqualNode(el)
          );

          if (isExists) return;

          el.classList.toggle('selected-list', true);

          selectedElements.push({
            el,
            id: el.id.slice(5),
            posY: parseInt(el.style.top, 10),
            posX: parseInt(el.style.left, 10),
          });
        });

        setTimeout(() => {
          hasDragged = false;
        }, 500);
      });
    }
    function clearSelectedElements() {
      selectedElements.forEach(({ el }) => {
        el.classList.remove('selected-list');
      });
      selectedElements = [];
      activeNode = null;
    }

    useShortcut('editor:duplicate-block', () => {
      const selectedElement = document.querySelector('.drawflow-node.selected');

      if (!selectedElement) return;

      duplicateBlock(selectedElement.id.substr(5));
    });

    watch(() => props.isShared, checkWorkflowData);

    onMounted(() => {
      const context = getCurrentInstance().appContext.app._context;
      const element = document.querySelector('#drawflow');

      element.addEventListener('mousedown', ({ target }) => {
        const nodeEl = target.closest('.drawflow-node');
        if (!nodeEl) return;

        if (nodeEl.classList.contains('selected-list')) {
          activeNode = {
            el: nodeEl,
            id: nodeEl.id.slice(5),
            posY: parseInt(nodeEl.style.top, 10),
            posX: parseInt(nodeEl.style.left, 10),
          };
        }

        isDragging = true;
      });
      element.addEventListener('mouseup', ({ target }) => {
        editor.value.editor_mode = 'edit';

        const isNodeEl = target.closest('.drawflow-node');
        if (!isNodeEl) return;

        const getPosition = (el) => {
          return {
            posY: parseInt(el.style.top, 10),
            posX: parseInt(el.style.left, 10),
          };
        };

        selectedElements.forEach(({ el }, index) => {
          Object.assign(selectedElements[index], getPosition(el));
        });

        if (activeNode) Object.assign(activeNode, getPosition(activeNode.el));

        isDragging = false;
      });
      element.addEventListener('click', ({ ctrlKey, target }) => {
        const nodeEl = target.closest('.drawflow-node');
        if (!nodeEl) {
          if (!hasDragged) clearSelectedElements();
          return;
        }

        const nodeProperties = {
          el: nodeEl,
          id: nodeEl.id.slice(5),
          posY: parseInt(nodeEl.style.top, 10),
          posX: parseInt(nodeEl.style.left, 10),
        };

        if (!ctrlKey && !hasDragged) {
          clearSelectedElements();

          activeNode = nodeProperties;
          nodeEl.classList.add('selected-list');
          selectedElements = [nodeProperties];
          hasDragged = false;

          return;
        }
        hasDragged = false;

        if (!ctrlKey) return;

        const nodeIndex = selectedElements.findIndex(({ el }) =>
          nodeEl.isEqualNode(el)
        );
        if (nodeIndex !== -1) {
          setTimeout(() => {
            nodeEl.classList.remove('selected-list', 'selected');
          }, 400);
          selectedElements.splice(nodeIndex, 1);
        } else {
          nodeEl.classList.add('selected-list');
          selectedElements.push(nodeProperties);
        }
      });
      element.addEventListener('keyup', ({ key, target }) => {
        const isAnInput =
          ['INPUT', 'TEXTAREA'].includes(target.tagName) &&
          target.isContentEditable;

        if (key !== 'Delete' || isAnInput) return;

        selectedElements.forEach(({ id }) => {
          editor.value.removeNodeId(`node-${id}`);
        });

        selectedElements = [];
        activeNode = null;
      });

      editor.value = drawflow(element, {
        context,
        options: {
          reroute: true,
          ...store.state.settings.editor,
        },
      });

      const editorStates =
        parseJSON(localStorage.getItem('editor-states'), {}) || {};
      const editorState = editorStates[workflowId];

      if (editorState) {
        editor.value.zoom = editorState.zoom;
        editor.value.canvas_x = editorState.canvas_x;
        editor.value.canvas_y = editorState.canvas_y;
      }

      editor.value.start();

      emit('load', editor.value);

      if (props.data) {
        let data =
          typeof props.data === 'string'
            ? parseJSON(props.data, null)
            : props.data;

        if (!data || !data?.drawflow?.Home) return;

        const currentExtVersion = chrome.runtime.getManifest().version;
        const isOldWorkflow = compare(
          currentExtVersion,
          props.version || '0.0.0',
          '>'
        );

        if (isOldWorkflow && typeof props.version !== 'boolean') {
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
      } else if (!props.isShared) {
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

      editor.value.on('mouseMove', () => {
        if (!activeNode || !isDragging) return;

        const xDistance =
          parseInt(activeNode.el.style.left, 10) - activeNode.posX;
        const yDistance =
          parseInt(activeNode.el.style.top, 10) - activeNode.posY;

        selectedElements.forEach(({ el, posX, posY }) => {
          if (el.isEqualNode(activeNode.el)) return;

          const nodeId = el.id.slice(5);
          const node = editor.value.drawflow.drawflow.Home.data[nodeId];

          const newPosX = posX + xDistance;
          const newPosY = posY + yDistance;

          node.pos_x = newPosX;
          node.pos_y = newPosY;
          el.style.top = `${newPosY}px`;
          el.style.left = `${newPosX}px`;

          editor.value.updateConnectionNodes(el.id);
        });

        hasDragged = true;
      });
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
      editor.value.on('export', saveEditorState);
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

      checkWorkflowData();
      initSelectArea();

      setTimeout(() => {
        editor.value.zoom_refresh();
        refreshConnection();
      }, 500);
    });
    onBeforeUnmount(saveEditorState);

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
  user-select: none;
}
.dark #drawflow {
  background-image: url('@/assets/images/tile-white.png');
}
.drawflow .drawflow-node {
  @apply dark:bg-gray-800;
}
#drawflow.with-arrow .drawflow-node .input {
  background-color: transparent !important;
  border-top: 10px solid transparent;
  border-radius: 0;
  border-left: 10px solid theme('colors.accent');
  border-right: 10px solid transparent;
  border-bottom: 10px solid transparent;
}
.selection-area {
  background: rgba(46, 115, 252, 0.11);
  border: 2px solid rgba(98, 155, 255, 0.81);
  border-radius: 0.1em;
}
</style>
