import {
  aliasesFromBlocks,
  getAliases,
  validateAliases,
  writeAliases,
} from './aliases';
import {
  WORKFLOW_OUTLINE_KIND,
  cloneValue,
  isPlainObject,
  normalizePosition,
  omitKeys,
  parseJson,
  revision,
} from './common';

function normalizeDrawflow(drawflow) {
  const parsed = parseJson(drawflow, {});

  if (Array.isArray(parsed?.nodes) || Array.isArray(parsed?.edges)) {
    return {
      ...omitKeys(parsed, ['nodes', 'edges']),
      edges: Array.isArray(parsed.edges) ? cloneValue(parsed.edges) : [],
      nodes: Array.isArray(parsed.nodes) ? cloneValue(parsed.nodes) : [],
    };
  }

  const legacyBlocks = parsed?.drawflow?.Home?.data;
  if (isPlainObject(legacyBlocks)) {
    const nodes = [];
    const edges = [];

    Object.values(legacyBlocks).forEach((block) => {
      const id = String(block.id);
      nodes.push({
        data: cloneValue(block.data || {}),
        id,
        label: block.name,
        position: {
          x: block.pos_x || 0,
          y: block.pos_y || 0,
        },
        type: block.html,
      });

      Object.values(block.outputs || {}).forEach((output, outputIndex) => {
        let outputName = `${outputIndex + 1}`;
        const outputs = Object.values(block.outputs || {});
        const isLast = outputIndex === outputs.length - 1;
        const isConditionsBlock = block.name === 'conditions';
        const isFallbackBlock = block.html === 'BlockBasicWithFallback';
        const isBlockFallback = block.html === 'BlockBasic' && outputIndex >= 1;

        if (
          (isConditionsBlock || isFallbackBlock || isBlockFallback) &&
          isLast
        ) {
          outputName = 'fallback';
        } else if (isConditionsBlock && block.data?.conditions?.[outputIndex]) {
          outputName = block.data.conditions[outputIndex].id;
        }

        (output.connections || []).forEach((connection) => {
          const target = String(connection.node);
          const nextSourceHandle = `${id}-output-${outputName}`;
          const nextTargetHandle = `${target}-${String(
            connection.output || 'input_1'
          ).replace('_', '-')}`;

          edges.push({
            class: `source-${nextSourceHandle} target-${nextTargetHandle}`,
            id: `vueflow__edge-${nextSourceHandle}-${nextTargetHandle}`,
            selectable: true,
            source: id,
            sourceHandle: nextSourceHandle,
            target,
            targetHandle: nextTargetHandle,
            updatable: true,
          });
        });
      });
    });

    return {
      x: parsed.x || 0,
      y: parsed.y || 0,
      zoom: parsed.zoom || 0,
      edges,
      nodes,
    };
  }

  return {
    edges: [],
    nodes: [],
  };
}

export function sourceHandle(nodeId, output = '1') {
  const normalizedOutput =
    output === null || output === undefined || output === '' ? '1' : output;
  const stringOutput = String(normalizedOutput);

  if (stringOutput.includes('-output-')) return stringOutput;

  return `${nodeId}-output-${stringOutput}`;
}

export function targetHandle(nodeId, input = '1') {
  const normalizedInput =
    input === null || input === undefined || input === '' ? '1' : input;
  const stringInput = String(normalizedInput);

  if (stringInput.includes('-input-')) return stringInput;

  return `${nodeId}-input-${stringInput}`;
}

export function parseSourceHandle(handle, source) {
  if (typeof handle !== 'string') return null;

  const prefix = `${source}-output-`;
  if (!handle.startsWith(prefix)) return null;

  return handle.slice(prefix.length);
}

export function parseTargetHandle(handle, target) {
  if (typeof handle !== 'string') return null;

  const prefix = `${target}-input-`;
  if (!handle.startsWith(prefix)) return null;

  return handle.slice(prefix.length);
}

function makeConnection(edge) {
  return {
    id: edge.id || `vueflow__edge-${edge.sourceHandle}-${edge.targetHandle}`,
    output: parseSourceHandle(edge.sourceHandle, edge.source),
    source: edge.source,
    sourceHandle: edge.sourceHandle,
    target: edge.target,
    targetHandle: edge.targetHandle,
    targetInput: parseTargetHandle(edge.targetHandle, edge.target),
    ui: omitKeys(edge, [
      'id',
      'source',
      'sourceHandle',
      'target',
      'targetHandle',
    ]),
  };
}

function makeBlock(node, aliases, connections) {
  const blockConnections = {
    incoming: connections.filter((connection) => connection.target === node.id),
    outgoing: connections.filter((connection) => connection.source === node.id),
  };

  return {
    alias: aliases[node.id] || null,
    component: node.type || null,
    connections: blockConnections,
    id: node.id,
    label: node.label || node.name || node.id,
    params: cloneValue(node.data || {}),
    position: normalizePosition(
      node.position || {
        x: node.pos_x,
        y: node.pos_y,
      }
    ),
    type: node.label || node.name || node.id,
    ui: omitKeys(node, ['id', 'label', 'type', 'data', 'position']),
  };
}

export function drawflowToOutline(workflow = {}, options = {}) {
  const drawflow = normalizeDrawflow(workflow.drawflow);
  const aliases = getAliases(workflow);
  const connections = drawflow.edges.map(makeConnection);
  const blocks = drawflow.nodes.map((node) =>
    makeBlock(node, aliases, connections)
  );
  const aliasValidation = validateAliases(aliases, {
    strict: options.strictAliases !== false,
  });

  return {
    kind: WORKFLOW_OUTLINE_KIND,
    aliases,
    blocks,
    connections,
    drawflowMeta: omitKeys(drawflow, ['nodes', 'edges']),
    errors: aliasValidation.errors,
    id: workflow.id || null,
    name: workflow.name || '',
    revision: revision(workflow),
    settings: cloneValue(workflow.settings || {}),
    trigger: cloneValue(workflow.trigger || null),
    updatedAt: workflow.updatedAt || null,
    warnings: aliasValidation.warnings,
  };
}

export function edgeId(source, target, nextSourceHandle, nextTargetHandle) {
  return `vueflow__edge-${nextSourceHandle}-${nextTargetHandle}`;
}

export function makeEdge({
  id = null,
  source,
  sourceHandle: nextSourceHandle,
  target,
  targetHandle: nextTargetHandle,
  ui = {},
}) {
  return {
    ...cloneValue(ui),
    id: id || edgeId(source, target, nextSourceHandle, nextTargetHandle),
    source,
    sourceHandle: nextSourceHandle,
    target,
    targetHandle: nextTargetHandle,
  };
}

export function makeNode(block) {
  return {
    ...cloneValue(block.ui || {}),
    data: cloneValue(block.params || {}),
    id: block.id,
    label: block.type || block.label,
    position: normalizePosition(block.position),
    type: block.component || block.ui?.type || block.type,
  };
}

export function outlineToDrawflow(
  outline,
  originalWorkflow = {},
  options = {}
) {
  const nextWorkflow = cloneValue(originalWorkflow || {});
  const drawflowMeta = {
    ...cloneValue(outline.drawflowMeta || {}),
    ...omitKeys(parseJson(originalWorkflow.drawflow, {}), ['nodes', 'edges']),
  };
  const nodes = outline.blocks.map(makeNode);
  const edges = outline.connections.map((connection) =>
    makeEdge({
      id: connection.id,
      source: connection.source,
      sourceHandle: connection.sourceHandle,
      target: connection.target,
      targetHandle: connection.targetHandle,
      ui: connection.ui,
    })
  );
  const aliases = aliasesFromBlocks(outline.blocks);

  nextWorkflow.id = outline.id || nextWorkflow.id;
  nextWorkflow.name = outline.name ?? nextWorkflow.name;
  nextWorkflow.drawflow = {
    ...drawflowMeta,
    edges,
    nodes,
  };
  nextWorkflow.settings = writeAliases(nextWorkflow.settings || {}, aliases);
  if (Object.prototype.hasOwnProperty.call(options, 'updatedAt')) {
    nextWorkflow.updatedAt = options.updatedAt;
  }

  return nextWorkflow;
}

function issue(code, details = {}) {
  return {
    code,
    severity: 'error',
    ...details,
  };
}

export function validateOutlineStructure(outline, options = {}) {
  const errors = [];
  const warnings = [];
  const nodeIds = new Set();
  const aliases = {};

  if (!outline || outline.kind !== WORKFLOW_OUTLINE_KIND) {
    errors.push(issue('invalid_outline'));

    return {
      errors,
      valid: false,
      warnings,
    };
  }

  (outline.blocks || []).forEach((block) => {
    if (!block.id) {
      errors.push(issue('missing_block_id', { block }));
      return;
    }

    if (nodeIds.has(block.id)) {
      errors.push(issue('duplicate_block_id', { nodeId: block.id }));
    }
    nodeIds.add(block.id);

    if (!block.type) {
      errors.push(issue('missing_block_type', { nodeId: block.id }));
    }
    if (block.alias) aliases[block.id] = block.alias;
  });

  (outline.connections || []).forEach((connection) => {
    if (!nodeIds.has(connection.source)) {
      errors.push(
        issue('missing_connection_source', {
          connectionId: connection.id,
          nodeId: connection.source,
        })
      );
    }
    if (!nodeIds.has(connection.target)) {
      errors.push(
        issue('missing_connection_target', {
          connectionId: connection.id,
          nodeId: connection.target,
        })
      );
    }
  });

  if (!outline.blocks.some((block) => block.type === 'trigger')) {
    errors.push(issue('missing_trigger'));
  }

  const aliasValidation = validateAliases(aliases, {
    strict: options.strictAliases !== false,
  });
  errors.push(...aliasValidation.errors);
  warnings.push(...aliasValidation.warnings);

  return {
    errors,
    valid: errors.length === 0,
    warnings,
  };
}

export default {
  drawflowToOutline,
  edgeId,
  makeEdge,
  makeNode,
  outlineToDrawflow,
  parseSourceHandle,
  parseTargetHandle,
  sourceHandle,
  targetHandle,
  validateOutlineStructure,
};
