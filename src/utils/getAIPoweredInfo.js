import secrets from 'secrets';

const BASE_URL = secrets.apApiUrl;

/**
 * @typedef {object} AIWorkflowInputOutput
 * @property {string} label - The display name of the node.
 * @property {string} name - The parameter name for the runtime API call.
 * @property {'TEXT'|'IMAGE'|'FILE'|'VIDEO'|'AUDIO'} type - The parameter type.
 * @property {string} [accept] - The acceptable file types (comma-separated).
 * @property {number} [maxSize] - The maximum file size in MB.
 */

/**
 * @typedef {object} AIWorkflowDetail
 * @property {string} flowUuid - The UUID of the AI workflow.
 * @property {string} name - The name of the AI workflow.
 * @property {AIWorkflowInputOutput[]} inputs - The array of input nodes.
 * @property {AIWorkflowInputOutput[]} output - The array of output nodes.
 */

/**
 * @typedef {object} APIDetailResponse
 * @property {number} code - Business status code (200 for success).
 * @property {boolean} success - Indicates if the request was successful.
 * @property {string} msg - Failure message.
 * @property {AIWorkflowDetail} data - The entity data.
 * @property {string} requestId - The request ID.
 */

/**
 * Fetches the details of an AI Power workflow.
 * @param {string} flowUuid - The UUID of the AI workflow.
 * @param {string} token - The authorization token.
 * @returns {Promise<APIDetailResponse>} The API response containing the workflow details.
 */
export const getAPWorkflowDetail = async (flowUuid, token) => {
  const url = new URL(`${BASE_URL}/oapi/power/v1/flow/detail`);
  url.searchParams.append('flowUuid', flowUuid);

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to fetch AI Power detail:', {
      status: response.status,
      data: errorData,
    });
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * @typedef {object} AIWorkflowListItem
 * @property {string} flowUuid - The UUID of the AI workflow.
 * @property {string} name - The name of the AI workflow.
 */

/**
 * @typedef {object} PaginationInfo
 * @property {number} total - Total number of records.
 * @property {number} size - Number of records per page.
 * @property {number} pages - Total number of pages.
 */

/**
 * @typedef {object} APIListResponse
 * @property {number} code - Business status code (200 for success).
 * @property {boolean} success - Indicates if the request was successful.
 * @property {string} msg - Failure message.
 * @property {AIWorkflowListItem[]} data - The list of AI workflows.
 * @property {PaginationInfo} page - Pagination information.
 * @property {string} requestId - The request ID.
 */

/**
 * @typedef {object} GetAPFlowListParams
 * @property {number} page - The page number.
 * @property {number} size - The number of items per page.
 * @property {string} [name] - The name to search for (fuzzy search).
 */

/**
 * Fetches a paginated list of AI Power workflows.
 * @param {GetAPFlowListParams} params - The pagination and search parameters.
 * @param {string} token - The authorization token.
 * @returns {Promise<APIListResponse>} The API response containing the list of workflows.
 */
export const getAPFlowList = async (params, token) => {
  const { page, size, name } = params;
  const url = new URL(`${BASE_URL}/oapi/power/v1/flow/page`);
  url.searchParams.append('page', String(page));
  url.searchParams.append('size', String(size));
  if (name) {
    url.searchParams.append('name', name);
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to fetch AI Power flow list:', {
      status: response.status,
      data: errorData,
    });
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * @typedef {object} AIWorkflowStatus
 * @property {'pending'|'success'|'failed'} status - The execution status.
 * @property {object} result - The execution result as a JSON object.
 * @property {string} [failReason] - The reason for failure.
 */

/**
 * @typedef {object} APIStatusResponse
 * @property {number} code - Business status code (200 for success).
 * @property {boolean} success - Indicates if the request was successful.
 * @property {string} msg - Failure message.
 * @property {AIWorkflowStatus} data - The status data.
 * @property {string} requestId - The request ID.
 */

/**
 * Fetches the execution status of an AI Power workflow.
 * @param {number | string} runRecordId - The run record ID of the AI workflow.
 * @param {string} token - The authorization token.
 * @returns {Promise<APIStatusResponse>} The API response containing the execution status.
 */
export const getAPFlowStatus = async (runRecordId, token) => {
  const url = new URL(`${BASE_URL}/oapi/power/v1/rest/flow/execute/result`);
  url.searchParams.append('runRecordId', String(runRecordId));

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to fetch AI Power flow status:', {
      status: response.status,
      data: errorData,
    });
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * @typedef {object} AIWorkflowExecuteResult
 * @property {number} runRecordId - The ID of the workflow run record.
 * @property {object} result - The output node data as a JSON object.
 */

/**
 * @typedef {object} APIExecuteResponse
 * @property {number} code - Business status code (200 for success).
 * @property {boolean} success - Indicates if the request was successful.
 * @property {string} msg - Failure message.
 * @property {AIWorkflowExecuteResult} data - The execution result data.
 * @property {string} requestId - The request ID.
 */

/**
 * @typedef {object} PostRunAPWorkflowParams
 * @property {string} flowUuid - The UUID of the AI workflow.
 * @property {object} input - The input parameters for the AI workflow.
 */

/**
 * Executes an AI Power workflow synchronously.
 * @param {PostRunAPWorkflowParams} params - The parameters for executing the workflow.
 * @param {string} token - The authorization token.
 * @returns {Promise<APIExecuteResponse>} The API response containing the execution result.
 */
export const postRunAPWorkflow = async ({ flowUuid, input }, token) => {
  const url = `${BASE_URL}/oapi/power/v1/rest/flow/${flowUuid}/execute`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      input,
      source: 'automa_extension',
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('Failed to execute AI Power workflow:', {
      status: response.status,
      data: errorData,
    });
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};
