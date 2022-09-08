import { customAlphabet } from 'nanoid';
import { excludeOnError } from '../shared';
import { getBlocks } from '../getSharedData';

const nanoid = customAlphabet('1234567890abcdefghijklmnopqrstuvwxyz', 7);

class DroppedNode {
  static isNode(target) {
    if (target.closest('.vue-flow__handle')) return null;

    return target.closest('.vue-flow__node');
  }

  static isHandle(target) {
    return target.closest('.vue-flow__handle.source');
  }

  static isEdge(target) {
    return target.closest('.vue-flow__edge');
  }

  static replaceNode(editor, { block, target: targetEl }) {
    const targetNode = editor.getNode.value(targetEl.dataset.id);

    if (targetNode.label === 'blocks-group' || block.fromBlockBasic) return;

    let blockData = block;
    if (block.fromBlockBasic) {
      const blocks = getBlocks();
      blockData = { ...blocks[block.id], id: block.id };
    }

    const onErrorEnabled =
      targetNode.data?.onError?.enable &&
      !excludeOnError.includes(blockData.id);
    const newNodeData = onErrorEnabled
      ? { ...blockData.data, onError: targetNode.data.onError }
      : blockData.data;

    const newNode = {
      id: nanoid(),
      data: newNodeData,
      label: blockData.id,
      type: blockData.component,
      position: targetNode.position,
    };

    const edges = editor.getEdges.value.reduce(
      (acc, { targetHandle, sourceHandle, target, source }) => {
        let pushData = false;

        if (target === targetNode.id) {
          targetHandle = targetHandle.replace(target, newNode.id);
          target = newNode.id;
          pushData = true;
        } else if (source === targetNode.id) {
          sourceHandle = sourceHandle.replace(source, newNode.id);
          source = newNode.id;
          pushData = true;
        }

        if (pushData) {
          acc.push({
            source,
            target,
            sourceHandle,
            targetHandle,
            id: `edge-${nanoid()}`,
            class: `source-${sourceHandle} target-${targetHandle}`,
          });
        }

        return acc;
      },
      []
    );

    editor.removeNodes([targetNode]);
    editor.addNodes([newNode]);
    editor.addEdges(edges);
  }

  static appendNode(editor, { target, nodeId }) {
    const { nodeid: source, handleid } = target.dataset;
    if (!source || !handleid) return;

    editor.addEdges([
      {
        source,
        target: nodeId,
        sourceHandle: handleid,
        targetHandle: `${nodeId}-input-1`,
      },
    ]);
  }

  static insertBetweenNode(editor, { target, nodeId, outputs }) {
    if (!target) return;

    const edgesChanges = [];
    const targetEdge = {
      target: '',
      source: '',
      targetHandle: '',
      sourceHandle: '',
    };

    target.classList.forEach((name) => {
      if (name.startsWith('source-')) {
        const sourceHandle = name.replace('source-', '');
        const outputIndex = sourceHandle.indexOf('-output');
        const sourceId = sourceHandle.slice(0, outputIndex);

        targetEdge.source = sourceId;
        targetEdge.sourceHandle = sourceHandle;

        return;
      }

      if (name.startsWith('target-')) {
        const targetHandle = name.replace('target-', '');
        const inputIndex = targetHandle.indexOf('-input');
        const targetId = targetHandle.slice(0, inputIndex);

        targetEdge.target = targetId;
        targetEdge.targetHandle = targetHandle;
      }
    });

    editor.getEdges.value.forEach((edge) => {
      const matchTarget = edge.targetHandle === targetEdge.targetHandle;
      const matchSource = edge.sourceHandle === targetEdge.sourceHandle;

      if (matchTarget && matchSource) {
        edgesChanges.push({ type: 'remove', id: edge.id });
      }
    });

    if (outputs > 0) {
      edgesChanges.push({
        type: 'add',
        item: {
          source: nodeId,
          id: `edge-${nanoid()}`,
          target: targetEdge.target,
          sourceHandle: `${nodeId}-output-1`,
          targetHandle: targetEdge.targetHandle,
        },
      });
    }

    edgesChanges.push({
      type: 'add',
      item: {
        target: nodeId,
        id: `edge-${nanoid()}`,
        source: targetEdge.source,
        targetHandle: `${nodeId}-input-1`,
        sourceHandle: targetEdge.sourceHandle,
      },
    });

    editor.applyEdgeChanges(edgesChanges);
  }
}

export default DroppedNode;
