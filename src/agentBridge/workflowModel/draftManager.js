/* global globalThis */

import { aliasesFromBlocks, resolveBlockReference } from './aliases';
import {
  cloneValue,
  makeWorkflowModelError,
  revision,
  stableStringify,
} from './common';
import { placeBlock } from './layout';
import {
  drawflowToOutline,
  makeEdge,
  outlineToDrawflow,
  sourceHandle,
  targetHandle,
  validateOutlineStructure,
} from './outline';
import { getSchema } from '../../utils/blockCatalogSchemas';
import { validateBlock } from '../../utils/blockValidationStructured';

function defaultIdGenerator(prefix = 'id') {
  const cryptoSource =
    typeof globalThis !== 'undefined' ? globalThis.crypto : null;
  if (cryptoSource?.randomUUID) return `${prefix}_${cryptoSource.randomUUID()}`;

  return `${prefix}_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2)}`;
}

function getNow(options = {}) {
  if (typeof options.now === 'function') return options.now();
  if (typeof options.now === 'number') return options.now;

  return Date.now();
}

function workflowsToObject(workflows) {
  if (Array.isArray(workflows)) {
    return workflows.reduce((acc, workflow) => {
      if (workflow?.id) acc[workflow.id] = workflow;

      return acc;
    }, {});
  }

  return workflows || {};
}

async function loadWorkflows(storage) {
  if (!storage) throw makeWorkflowModelError('storage_unavailable');

  const result = await storage.get('workflows');
  return workflowsToObject(result?.workflows);
}

async function saveWorkflow(storage, workflow) {
  const workflows = await loadWorkflows(storage);
  workflows[workflow.id] = workflow;
  await storage.set({ workflows });

  return workflow;
}

function getDraft(registry, draftId) {
  const draft = registry.get(draftId);
  if (!draft) throw makeWorkflowModelError('draft_not_found', { draftId });

  return draft;
}

function assignAliases(outline) {
  outline.aliases = aliasesFromBlocks(outline.blocks);

  return outline.aliases;
}

function refreshBlockConnections(outline) {
  outline.blocks.forEach((block) => {
    block.connections = {
      incoming: outline.connections.filter(
        (connection) => connection.target === block.id
      ),
      outgoing: outline.connections.filter(
        (connection) => connection.source === block.id
      ),
    };
  });
}

function ensureUniqueAliases(outline) {
  const seen = new Map();

  outline.blocks.forEach((block) => {
    if (!block.alias) return;
    if (seen.has(block.alias)) {
      throw makeWorkflowModelError('duplicate_alias', {
        alias: block.alias,
        nodeId: block.id,
        otherNodeId: seen.get(block.alias),
      });
    }
    seen.set(block.alias, block.id);
  });
  assignAliases(outline);
}

function makeConnection(sourceBlock, targetBlock, options = {}) {
  const nextSourceHandle = sourceHandle(
    sourceBlock.id,
    options.sourceHandle || options.handle || '1'
  );
  const nextTargetHandle = targetHandle(targetBlock.id, options.targetHandle);

  return {
    id: options.id || `vueflow__edge-${nextSourceHandle}-${nextTargetHandle}`,
    output: options.sourceHandle || options.handle || '1',
    source: sourceBlock.id,
    sourceHandle: nextSourceHandle,
    target: targetBlock.id,
    targetHandle: nextTargetHandle,
    targetInput: options.targetHandle || '1',
    ui: {
      class: `source-${nextSourceHandle} target-${nextTargetHandle}`,
      selectable: true,
      updatable: true,
    },
  };
}

function connectionMatches(connection, sourceBlock, targetBlock, options = {}) {
  if (sourceBlock && connection.source !== sourceBlock.id) return false;
  if (targetBlock && connection.target !== targetBlock.id) return false;
  if (options.sourceHandle) {
    const expected = sourceHandle(sourceBlock.id, options.sourceHandle);
    if (connection.sourceHandle !== expected) return false;
  }
  if (options.targetHandle) {
    const expected = targetHandle(targetBlock.id, options.targetHandle);
    if (connection.targetHandle !== expected) return false;
  }

  return true;
}

function diffLists(baseItems, draftItems, serialize) {
  const base = new Map(baseItems.map((item) => [item.id, item]));
  const draft = new Map(draftItems.map((item) => [item.id, item]));
  const added = [];
  const removed = [];
  const updated = [];

  draft.forEach((item, id) => {
    if (!base.has(id)) added.push(id);
    else if (serialize(base.get(id)) !== serialize(item)) updated.push(id);
  });
  base.forEach((_item, id) => {
    if (!draft.has(id)) removed.push(id);
  });

  return {
    added,
    removed,
    updated,
  };
}

function getTriggerBlock(workflow) {
  return workflow.drawflow?.nodes?.find((node) => node.label === 'trigger');
}

export function createWorkflowDraftManager(options = {}) {
  const registry = new Map();
  const { storage } = options;
  const idGenerator = options.idGenerator || defaultIdGenerator;
  const now = () => getNow(options);

  async function beginDraft(workflowId) {
    const workflows = await loadWorkflows(storage);
    const { [workflowId]: liveWorkflow } = workflows;
    if (!liveWorkflow) {
      throw makeWorkflowModelError('workflow_not_found', { workflowId });
    }

    const draftId = idGenerator('draft');
    const baseRevision = revision(liveWorkflow);
    const baseWorkflow = cloneValue(liveWorkflow);
    const outline = drawflowToOutline(baseWorkflow);
    const draft = {
      baseOutline: cloneValue(outline),
      baseRevision,
      baseWorkflow,
      createdAt: now(),
      draftId,
      outline: cloneValue(outline),
      updatedAt: now(),
      workflowId,
    };

    registry.set(draftId, draft);

    return {
      baseRevision,
      draftId,
      outline: cloneValue(draft.outline),
      workflowId,
    };
  }

  async function validate(draftId, validateOptions = {}) {
    const draft = getDraft(registry, draftId);
    const structure = validateOutlineStructure(draft.outline, validateOptions);
    const blockIssues = await Promise.all(
      draft.outline.blocks.map(async (block) => {
        const result = await validateBlock(block.type, block.params, {
          ...validateOptions,
          alias: block.alias,
          blockId: block.id,
        });

        return {
          errors: result.errors,
          nodeId: block.id,
          normalizedData: result.normalizedData,
          warnings: result.warnings,
        };
      })
    );
    const errors = [
      ...structure.errors,
      ...blockIssues.flatMap((result) => result.errors),
    ];
    const warnings = [
      ...structure.warnings,
      ...blockIssues.flatMap((result) => result.warnings),
    ];

    return {
      errors,
      valid: errors.length === 0,
      warnings,
    };
  }

  function diffDraft(draftId) {
    const draft = getDraft(registry, draftId);
    const blocks = diffLists(
      draft.baseOutline.blocks,
      draft.outline.blocks,
      (block) =>
        stableStringify({
          alias: block.alias,
          component: block.component,
          label: block.label,
          params: block.params,
          position: block.position,
          type: block.type,
        })
    );
    const connections = diffLists(
      draft.baseOutline.connections,
      draft.outline.connections,
      (connection) =>
        stableStringify({
          source: connection.source,
          sourceHandle: connection.sourceHandle,
          target: connection.target,
          targetHandle: connection.targetHandle,
        })
    );
    const changed =
      blocks.added.length > 0 ||
      blocks.removed.length > 0 ||
      blocks.updated.length > 0 ||
      connections.added.length > 0 ||
      connections.removed.length > 0 ||
      connections.updated.length > 0;

    return {
      blocks,
      changed,
      connections,
    };
  }

  function discardDraft(draftId) {
    return registry.delete(draftId);
  }

  async function addBlock(draftId, type, blockOptions = {}) {
    const draft = getDraft(registry, draftId);
    const schema = getSchema(type, blockOptions);
    const validation = await validateBlock(type, blockOptions.params || {}, {
      ...blockOptions,
      alias: blockOptions.alias,
    });

    if (validation.errors.length > 0) {
      throw makeWorkflowModelError('validation_error', {
        errors: validation.errors,
      });
    }

    const sourceBlock = blockOptions.sourceRef
      ? resolveBlockReference(draft.outline, blockOptions.sourceRef)
      : null;
    const block = {
      alias: blockOptions.alias || null,
      component: schema.component || type,
      connections: {
        incoming: [],
        outgoing: [],
      },
      id: blockOptions.id || idGenerator('node'),
      label: type,
      params: validation.normalizedData,
      position: placeBlock(draft.outline.blocks, {
        sourceId: sourceBlock?.id,
      }),
      type,
      ui: {},
    };

    draft.outline.blocks.push(block);
    try {
      ensureUniqueAliases(draft.outline);
    } catch (error) {
      draft.outline.blocks = draft.outline.blocks.filter(
        (item) => item.id !== block.id
      );
      assignAliases(draft.outline);
      throw error;
    }
    refreshBlockConnections(draft.outline);
    draft.updatedAt = now();

    return cloneValue(block);
  }

  async function updateBlock(draftId, reference, updates = {}) {
    const draft = getDraft(registry, draftId);
    const block = resolveBlockReference(draft.outline, reference);
    if (!block) throw makeWorkflowModelError('block_not_found', { reference });

    const nextParams = {
      ...cloneValue(block.params || {}),
      ...cloneValue(updates.params || {}),
    };
    const validation = await validateBlock(block.type, nextParams, {
      ...updates,
      alias: updates.alias || block.alias,
      blockId: block.id,
    });

    if (validation.errors.length > 0) {
      throw makeWorkflowModelError('validation_error', {
        errors: validation.errors,
      });
    }

    const previousParams = block.params;
    const previousAlias = block.alias;

    try {
      block.params = validation.normalizedData;
      if (Object.prototype.hasOwnProperty.call(updates, 'alias')) {
        block.alias = updates.alias || null;
      }
      ensureUniqueAliases(draft.outline);
    } catch (error) {
      block.params = previousParams;
      block.alias = previousAlias;
      assignAliases(draft.outline);
      throw error;
    }
    draft.updatedAt = now();

    return cloneValue(block);
  }

  function removeBlock(draftId, reference) {
    const draft = getDraft(registry, draftId);
    const block = resolveBlockReference(draft.outline, reference);
    if (!block) throw makeWorkflowModelError('block_not_found', { reference });

    draft.outline.blocks = draft.outline.blocks.filter(
      (item) => item.id !== block.id
    );
    draft.outline.connections = draft.outline.connections.filter(
      (connection) =>
        connection.source !== block.id && connection.target !== block.id
    );
    assignAliases(draft.outline);
    refreshBlockConnections(draft.outline);
    draft.updatedAt = now();

    return {
      removedBlockId: block.id,
    };
  }

  function connectBlocks(
    draftId,
    sourceReference,
    targetReference,
    optionsArg
  ) {
    const draft = getDraft(registry, draftId);
    const optionsValue =
      typeof optionsArg === 'string'
        ? { sourceHandle: optionsArg }
        : optionsArg || {};
    const sourceBlock = resolveBlockReference(draft.outline, sourceReference);
    const targetBlock = resolveBlockReference(draft.outline, targetReference);
    if (!sourceBlock) {
      throw makeWorkflowModelError('block_not_found', {
        reference: sourceReference,
      });
    }
    if (!targetBlock) {
      throw makeWorkflowModelError('block_not_found', {
        reference: targetReference,
      });
    }

    const connection = makeConnection(sourceBlock, targetBlock, optionsValue);
    const exists = draft.outline.connections.some(
      (item) =>
        item.sourceHandle === connection.sourceHandle &&
        item.targetHandle === connection.targetHandle &&
        item.target === connection.target
    );

    if (!exists) draft.outline.connections.push(connection);
    refreshBlockConnections(draft.outline);
    draft.updatedAt = now();

    return cloneValue(connection);
  }

  function disconnectBlocks(
    draftId,
    sourceReference,
    targetReference,
    optionsValue = {}
  ) {
    const draft = getDraft(registry, draftId);
    const sourceBlock = resolveBlockReference(draft.outline, sourceReference);
    const targetBlock = resolveBlockReference(draft.outline, targetReference);
    if (!sourceBlock || !targetBlock) return { removed: [] };

    const removed = [];
    draft.outline.connections = draft.outline.connections.filter(
      (connection) => {
        const matches = connectionMatches(
          connection,
          sourceBlock,
          targetBlock,
          optionsValue
        );
        if (matches) removed.push(connection.id);

        return !matches;
      }
    );
    refreshBlockConnections(draft.outline);
    draft.updatedAt = now();

    return {
      removed,
    };
  }

  async function appendBlock(
    draftId,
    sourceReference,
    type,
    blockOptions = {}
  ) {
    const draft = getDraft(registry, draftId);
    const sourceBlock = resolveBlockReference(draft.outline, sourceReference);
    if (!sourceBlock) {
      throw makeWorkflowModelError('block_not_found', {
        reference: sourceReference,
      });
    }

    const block = await addBlock(draftId, type, {
      ...blockOptions,
      sourceRef: sourceBlock.id,
    });
    const connection = connectBlocks(draftId, sourceBlock.id, block.id, {
      sourceHandle: blockOptions.sourceHandle || blockOptions.handle || '1',
      targetHandle: blockOptions.targetHandle || '1',
    });

    return {
      block,
      connection,
    };
  }

  async function insertBlock(
    draftId,
    sourceReference,
    targetReference,
    type,
    blockOptions = {}
  ) {
    const draft = getDraft(registry, draftId);
    const sourceBlock = resolveBlockReference(draft.outline, sourceReference);
    const targetBlock = resolveBlockReference(draft.outline, targetReference);
    if (!sourceBlock || !targetBlock) {
      throw makeWorkflowModelError('block_not_found');
    }

    const matchingConnections = draft.outline.connections.filter((connection) =>
      connectionMatches(connection, sourceBlock, targetBlock, blockOptions)
    );
    draft.outline.connections = draft.outline.connections.filter(
      (connection) => !matchingConnections.includes(connection)
    );
    refreshBlockConnections(draft.outline);

    const block = await addBlock(draftId, type, {
      ...blockOptions,
      sourceRef: sourceBlock.id,
    });
    const firstConnection = matchingConnections[0] || {};
    const sourceToInserted = connectBlocks(draftId, sourceBlock.id, block.id, {
      sourceHandle:
        blockOptions.sourceHandle ||
        firstConnection.sourceHandle ||
        blockOptions.handle ||
        '1',
    });
    const insertedToTarget = connectBlocks(draftId, block.id, targetBlock.id, {
      sourceHandle: blockOptions.newSourceHandle || '1',
      targetHandle: firstConnection.targetHandle || blockOptions.targetHandle,
    });

    return {
      block,
      insertedToTarget,
      removedConnectionIds: matchingConnections.map(
        (connection) => connection.id
      ),
      sourceToInserted,
    };
  }

  async function commitDraft(draftId) {
    const draft = getDraft(registry, draftId);
    const workflows = await loadWorkflows(storage);
    const { [draft.workflowId]: liveWorkflow } = workflows;
    if (!liveWorkflow) {
      throw makeWorkflowModelError('workflow_not_found', {
        workflowId: draft.workflowId,
      });
    }
    const liveRevision = revision(liveWorkflow);
    if (liveRevision !== draft.baseRevision) {
      throw makeWorkflowModelError('workflow_conflict', {
        baseRevision: draft.baseRevision,
        liveRevision,
      });
    }

    const updatedWorkflow = outlineToDrawflow(draft.outline, liveWorkflow, {
      updatedAt: now(),
    });
    await saveWorkflow(storage, updatedWorkflow);

    if (
      typeof options.registerWorkflowTrigger === 'function' &&
      !updatedWorkflow.isDisabled
    ) {
      const triggerBlock = getTriggerBlock(updatedWorkflow);
      if (triggerBlock) {
        await options.registerWorkflowTrigger(updatedWorkflow.id, triggerBlock);
      }
    }

    registry.delete(draftId);

    return {
      draftId,
      revision: revision(updatedWorkflow),
      workflow: cloneValue(updatedWorkflow),
      workflowId: updatedWorkflow.id,
    };
  }

  function getDraftState(draftId) {
    return cloneValue(getDraft(registry, draftId));
  }

  return {
    addBlock,
    appendBlock,
    beginDraft,
    commitDraft,
    connectBlocks,
    diffDraft,
    discardDraft,
    disconnectBlocks,
    getDraftState,
    insertBlock,
    removeBlock,
    updateBlock,
    validate,
  };
}

export default {
  createWorkflowDraftManager,
  makeEdge,
};
