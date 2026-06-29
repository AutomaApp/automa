import defu from 'defu';
import { createBlocksValidation } from '../newtab/utils/blocksValidationCore';
import { cloneValue, getSchema } from './blockCatalogSchemas';

const PATH_HINTS = [
  [/spreadsheet id/i, 'data.spreadsheetId'],
  [/reference key|ref key/i, 'data.refKey'],
  [/variable name/i, 'data.variableName'],
  [/context menu name/i, 'data.contextMenuName'],
  [/match patterns/i, 'data.matchPattern'],
  [/tab title/i, 'data.tabTitle'],
  [/css selector|selector/i, 'data.selector'],
  [/attribute name/i, 'data.attributeName'],
  [/file paths?/i, 'data.filePaths'],
  [/workflow/i, 'data.workflowId'],
  [/shortcut/i, 'data.shortcut'],
  [/expression/i, 'data.expression'],
  [/range/i, 'data.range'],
  [/keys/i, 'data.keys'],
  [/date/i, 'data.date'],
  [/host/i, 'data.host'],
  [/url/i, 'data.url'],
];

function messageFromIssue(issue) {
  if (typeof issue === 'string') return issue;
  if (issue instanceof Error) return issue.message;
  if (issue && typeof issue.message === 'string') return issue.message;

  return 'Validation failed';
}

function inferIssuePath(message) {
  const match = PATH_HINTS.find(([pattern]) => pattern.test(message));

  return match ? match[1] : 'data';
}

function inferIssueCode(message) {
  if (
    /permission|permissions|download|clipboard|cookies|notifications/i.test(
      message
    )
  ) {
    return 'missing_permission';
  }
  if (/duplicate/i.test(message)) return 'duplicate_parameter';
  if (/invalid|not valid/i.test(message)) return 'invalid_parameter';
  if (/empty|missing|required|no .*selected/i.test(message)) {
    return 'missing_parameter';
  }

  return 'validation_error';
}

function inferIssueSeverity(code) {
  return code === 'missing_permission' ? 'warning' : 'error';
}

function makeIssue({
  alias,
  blockId,
  code,
  message,
  path = 'data',
  severity = 'error',
}) {
  return {
    alias,
    blockId,
    code,
    message,
    path,
    severity,
  };
}

export function normalizeValidatorIssue(issue, context = {}) {
  if (issue instanceof Error) {
    return makeIssue({
      ...context,
      code: 'validator_error',
      message: 'Validator failed',
      severity: 'error',
    });
  }

  if (issue && typeof issue === 'object' && typeof issue.code === 'string') {
    return makeIssue({
      ...context,
      code: issue.code,
      message: issue.message || 'Validation failed',
      path: issue.path || 'data',
      severity: issue.severity || 'error',
    });
  }

  const message = messageFromIssue(issue);
  const code = inferIssueCode(message);

  return makeIssue({
    ...context,
    code,
    message,
    path: inferIssuePath(message),
    severity: inferIssueSeverity(code),
  });
}

function addNormalizedIssues(target, issues, context, defaultSeverity) {
  const issueList = Array.isArray(issues) ? issues : [issues];
  issueList.forEach((issue) => {
    if (issue === undefined || issue === null) return;

    const normalized = normalizeValidatorIssue(issue, context);
    if (defaultSeverity && !issue?.severity) {
      normalized.severity = defaultSeverity;
    }

    target.push(normalized);
  });
}

function splitValidatorResult(result, context) {
  const issues = [];

  if (result && typeof result === 'object' && !Array.isArray(result)) {
    if (Array.isArray(result.errors) || Array.isArray(result.warnings)) {
      addNormalizedIssues(issues, result.errors || [], context, 'error');
      addNormalizedIssues(issues, result.warnings || [], context, 'warning');

      return issues;
    }
  }

  addNormalizedIssues(issues, result || [], context);

  return issues;
}

function splitIssuesBySeverity(issues) {
  return {
    errors: issues.filter((issue) => issue.severity !== 'warning'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
  };
}

function isSavedBlockData(type, data) {
  if (type !== 'block-package' || !data || typeof data !== 'object') {
    return false;
  }

  return Boolean(data.settings || data.data || data.drawflow || data.nodes);
}

function unsafeMessage(kind, type) {
  if (kind === 'unknown_block') return `Unknown block type "${type}"`;
  if (kind === 'unsafe_saved_block') {
    return `Saved block "${type}" does not expose enough schema metadata`;
  }
  if (kind === 'unsafe_custom_block') {
    return `Custom block "${type}" does not expose enough schema metadata`;
  }

  return `Block "${type}" does not expose enough schema metadata`;
}

function unsafeCode(kind) {
  if (kind === 'unknown_block') return 'unknown_block_type';

  return kind;
}

function unsafeValidationResult({ data, kind, schema, unsafeRaw }) {
  const code = unsafeCode(kind);
  const issue = makeIssue({
    alias: schema.alias,
    blockId: schema.type,
    code,
    message: unsafeMessage(kind, schema.type),
    path: 'type',
    severity: unsafeRaw ? 'warning' : 'error',
  });

  return {
    errors: unsafeRaw ? [] : [issue],
    normalizedData: cloneValue(data),
    warnings: unsafeRaw ? [issue] : [],
  };
}

function getNormalizedData(schema, data) {
  const rawData = data && typeof data === 'object' ? cloneValue(data) : {};

  if (schema.kind !== 'block') return rawData;

  return defu(rawData, cloneValue(schema.data));
}

export async function validateBlock(type, data = {}, options = {}) {
  const schema = getSchema(type, options);
  const normalizedData = getNormalizedData(schema, data);

  if (schema.kind === 'unknown_block' || schema.unsafe) {
    return unsafeValidationResult({
      data: normalizedData,
      kind: schema.kind,
      schema,
      unsafeRaw: Boolean(options.unsafeRaw),
    });
  }

  if (isSavedBlockData(type, data)) {
    return unsafeValidationResult({
      data: normalizedData,
      kind: 'unsafe_saved_block',
      schema,
      unsafeRaw: Boolean(options.unsafeRaw),
    });
  }

  const blocksValidation =
    options.blocksValidation ||
    createBlocksValidation(options.dependencies || options.validationContext);
  const validator = blocksValidation[type]?.func;

  if (!validator) {
    return {
      errors: [],
      normalizedData,
      warnings: [],
    };
  }

  const issueContext = {
    alias: options.alias || schema.alias,
    blockId: options.blockId || type,
  };

  try {
    const validationResult = await validator(normalizedData);
    const issues = splitValidatorResult(validationResult, issueContext);

    return {
      ...splitIssuesBySeverity(issues),
      normalizedData,
    };
  } catch (error) {
    return {
      errors: [normalizeValidatorIssue(error, issueContext)],
      normalizedData,
      warnings: [],
    };
  }
}

export default {
  normalizeValidatorIssue,
  validateBlock,
};
