# PRD: Agent Workflow Authoring Bridge for Automa

## Summary

Build an autonomous, agent-friendly authoring system for Automa workflows. An AI agent must be able to inspect workflows, discover available blocks and parameters, create and edit workflows action by action, commit changes to the installed extension, run workflows, inspect bounded results, and iterate without user prompts during a task.

The primary target is Chrome Manifest V3. The installed extension workflow store is the primary backend. Importable/exportable workflow files are a secondary backend for tests, import/export, and offline generation.

## Goals

- Let AI agents manipulate all Automa workflow blocks through a structured interface instead of raw JSON or UI clicks.
- Let agents fetch workflow, block schema, and bounded runtime data.
- Let agents commit and test workflows automatically in Trusted Agent Mode without interactive prompts between steps.
- Preserve existing Automa workflow storage and execution behavior.
- Provide a CLI for shell-based agents and humans.

## Non-Goals

- Do not use visual UI automation as the primary authoring method.
- Do not directly edit Chrome profile storage files.
- Do not create or manage Automa AI Power workflows in v1.
- Do not support Firefox as a first implementation target.
- Do not add native messaging in v1.
- Do not build a draft workflow simulator in v1.

## Domain Terms

- Workflow: a browser automation made from connected blocks.
- Block: a single workflow action or control point with parameters and connection points.
- Block Catalog: the available set of block types an author can place in a workflow.
- Block Schema: the authoring contract for a block type, including parameters and connection shape.
- Workflow Outline: an agent-facing workflow view showing blocks, parameters, aliases, and logical connections without canvas layout details.
- Block Alias: an author-readable name for referring to a block while editing a workflow.
- Workflow Draft: a temporary editable workflow state that can be validated and committed.
- Extension Workflow Store: the workflow collection persisted by the installed Automa extension.
- Workflow File: an importable or exportable workflow document outside the installed extension.
- Trusted Agent Mode: an unattended mode where an authorized AI agent can edit, commit, run, inspect, and iterate without interactive approval between steps.
- Capability Set: operations granted to an agent session before it begins authoring workflows.
- Structured Validation: validation that reports stable machine-readable errors for agent correction.
- AI Power Workflow: an external AI workflow that can be selected and executed from an Automa workflow.

## Architecture

The system must add a background-owned agent command bridge.

- The background service worker owns command execution.
- The existing `webService.bundle.js` localhost injection acts as the transport proxy.
- The CLI starts a localhost bridge server, opens a bridge page, waits for an extension handshake, then sends JSON commands.
- The bridge page communicates with `webService.bundle.js`.
- `webService` forwards commands to background.
- Background validates capabilities, executes commands, writes audit events, and returns a standard response envelope.

## Trust And Capabilities

Trusted Agent Mode is the primary autonomous workflow.

Use one-time setup token:

- A user or setup agent enables the bridge once with a shared secret and capability config.
- Later runs use the token and capability set without prompts.
- Missing capability returns a structured error immediately.
- Audit logs record command summaries with redacted payloads by default.

Capabilities:

- `extension:read`
- `extension:write`
- `workflow:run`
- `runtime:read`
- `external:request`
- `dangerous:block`

## Public Interfaces

Add an npm bin:

```json
{
  "bin": {
    "automa-agent": "bin/automa-agent.mjs"
  }
}
```

CLI examples:

```bash
automa-agent bridge start --trusted --token <token>
automa-agent workflow list
automa-agent workflow get <id> --format outline
automa-agent workflow begin-draft <id>
automa-agent workflow add-block <draftId> new-tab --alias open_site --param url=https://example.com
automa-agent workflow connect <draftId> open_site extract_title
automa-agent workflow validate <draftId>
automa-agent workflow commit <draftId>
automa-agent workflow run <workflowId>
automa-agent workflow logs <workflowId> --limit 20
automa-agent blocks list
automa-agent blocks schema new-tab
```

Core JSON command envelope:

```json
{
  "id": "cmd_1",
  "command": "workflow.addBlock",
  "capabilities": ["extension:write"],
  "payload": {}
}
```

Standard response envelope:

```json
{
  "ok": true,
  "data": {},
  "warnings": [],
  "errors": [],
  "auditId": "audit_1"
}
```

## Command Groups

Workflow reads:

- `workflow.list`
- `workflow.getOutline`
- `workflow.getRaw`

Draft authoring:

- `workflow.beginDraft`
- `workflow.addBlock`
- `workflow.updateBlock`
- `workflow.removeBlock`
- `workflow.connectBlocks`
- `workflow.disconnectBlocks`
- `workflow.appendBlock`
- `workflow.insertBlock`
- `workflow.validate`
- `workflow.diffDraft`
- `workflow.commitDraft`
- `workflow.discardDraft`

Workflow storage:

- `workflow.create`
- `workflow.replace`
- `workflow.delete`

Block catalog:

- `blocks.list`
- `blocks.getSchema`
- `blocks.search`

Runtime:

- `workflow.run`
- `workflow.stop`
- `workflow.getRunState`
- `workflow.getLogs`
- `workflow.getLogDetail`
- `workflow.getTable`

## Workflow Model

Agents manipulate Workflow Outlines, not raw VueFlow graph data.

The outline must include:

- workflow id and name
- block ids
- block aliases
- block types
- block parameters
- logical connections
- warnings and errors

Internal storage remains Automa `drawflow`.

Block aliases:

- Persist under workflow settings metadata keyed by internal node ID.
- Do not replace Automa node IDs.
- Reject duplicate aliases in strict mode.

Connections:

- Support explicit graph connections with output handles.
- Provide `appendBlock` and `insertBlock` helpers.
- Preserve multi-output, fallback, and branching blocks.

Layout:

- Agents do not provide x/y positions by default.
- Bridge computes deterministic layout.
- Existing positions are preserved where possible.
- New blocks are placed near their logical source and must avoid overlap.

## Block Schema And Validation

Schema generation is code-first.

Sources:

- `tasks` and custom blocks from `getBlocks()`
- block default `data`
- `inputs` and `outputs`
- validation helpers from `src/newtab/utils/blocksValidation.js`

Schemas include:

- block type
- category
- defaults
- inferred primitive types
- required parameters where known
- connection shape
- optional docs URL later

Validation rules:

- Strict by default.
- Return machine-readable structured errors.
- Existing UI validators may be used as adapters, but must be normalized.
- `unsafeRaw: true` allows custom or unknown block data.
- Validation warnings do not block Trusted Agent Mode unless the structure is invalid.

AI Power:

- Treat `ai-workflow` as a normal Block Catalog entry.
- Do not create, publish, or manage AI Power workflows in v1.

## Drafts And Concurrency

Drafts are in memory in v1.

- `beginDraft` records base revision from `updatedAt` or a content hash.
- Draft mutations do not write to the live workflow.
- `commitDraft` checks optimistic concurrency.
- If the live workflow changed, reject with `workflow_conflict`.
- The agent must refetch and reapply after conflict.

Persisted drafts are out of scope for v1.

## Runtime Reads And Automatic Testing

Automatic testing uses committed real workflow runs.

Flow:

1. Create or edit draft.
2. Validate.
3. Commit.
4. Run through the normal Automa engine.
5. Read bounded logs and results.
6. Iterate if needed.

Runtime reads are bounded by default:

- logs: latest 20 summaries
- log detail: one selected log
- table: first 100 rows with cursor or pagination when practical

## Audit Logging

Trusted mode writes command-level audit logs with redacted payloads by default.

Audit events include:

- timestamp
- session id
- command name
- workflow id when applicable
- capabilities used
- result status
- diff summary where applicable
- audit id

Do not record full sensitive payloads by default:

- cookies
- secrets
- uploaded file contents
- huge tables or logs
- raw page data

Support optional verbose audit mode for debugging.

## Acceptance Criteria

- A CLI command can start a bridge session and complete extension handshake unattended.
- The bridge can list workflows from the installed extension workflow store.
- The bridge can return a Workflow Outline for an existing workflow.
- The bridge can list block catalog entries and return a schema for `new-tab`, `trigger`, `conditions`, and `ai-workflow`.
- The bridge can create a draft, add blocks with aliases, connect blocks, validate, diff, commit, run, and inspect logs.
- Duplicate block aliases are rejected.
- Invalid parameters return structured errors.
- `unsafeRaw` permits unknown custom block data.
- Live workflow commit rejects if base revision changed.
- Runtime reads enforce default limits.
- Trusted Agent Mode never prompts between commands.
- Audit logs are written and redact sensitive fields.
- Existing Automa UI can still open and edit workflows created by the bridge.
- `npm run build` succeeds.
- Existing lint rules pass.

## Test Strategy

Use Node built-in tests for pure modules where possible.

Test cases:

- Block schema generation for representative blocks.
- Structured validation for missing and invalid parameters.
- Workflow drawflow to outline conversion and back.
- Alias persistence in workflow settings metadata.
- Draft mutations do not affect live workflow until commit.
- Optimistic concurrency conflict.
- Connection creation for linear and multi-output blocks.
- Deterministic layout placement for new blocks.
- Runtime read limit behavior.
- Audit redaction.
- CLI JSON envelope parsing and response handling.

Manual integration scenario:

1. Start a Chrome MV3 dev extension build.
2. Run `automa-agent bridge start --trusted`.
3. Fetch workflows.
4. Create a draft.
5. Add `new-tab` and `get-text` blocks.
6. Commit.
7. Run the workflow.
8. Fetch latest logs.
9. Confirm the workflow is visible and editable in the Automa UI.

## Implementation Defaults

- Chrome MV3 first.
- Extension store primary.
- Workflow file backend secondary.
- Localhost bridge transport.
- Background owns command handling.
- CLI auto-opens bridge page.
- One-time setup token.
- Trusted Agent Mode primary.
- Code-first schemas.
- In-memory drafts.
- Real committed workflow run for automatic testing.
