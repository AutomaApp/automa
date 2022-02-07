import secrets from 'secrets';
import { parseJSON } from './helper';

export function fetchApi(path, options) {
  const urlPath = path.startsWith('/') ? path : `/${path}`;

  return fetch(`${secrets.baseApiUrl}${urlPath}`, options);
}

export const googleSheets = {
  getUrl(spreadsheetId, range) {
    return `/services/google-sheets?spreadsheetId=${spreadsheetId}&range=${range}`;
  },
  getValues({ spreadsheetId, range }) {
    const url = this.getUrl(spreadsheetId, range);

    return fetchApi(url);
  },
  updateValues({ spreadsheetId, range, valueInputOption, options = {} }) {
    const url = `${this.getUrl(spreadsheetId, range)}&valueInputOption=${
      valueInputOption || 'RAW'
    }`;

    return fetchApi(url, {
      ...options,
      method: 'PUT',
    });
  },
};

export async function getSharedWorkflows(useCache = true) {
  try {
    const sharedWorkflowsStorage = parseJSON(
      sessionStorage.getItem('shared-workflows'),
      null
    );

    if (sharedWorkflowsStorage && useCache) {
      return sharedWorkflowsStorage;
    }

    const response = await fetchApi('/me/workflows/shared?data=all');

    if (response.status !== 200) throw new Error(response.statusText);

    const result = await response.json();
    const sharedWorkflows = result.reduce((acc, item) => {
      item.drawflow = JSON.stringify(item.drawflow);
      item.table = item.table || item.dataColumns || [];
      item.createdAt = new Date(item.createdAt || Date.now()).getTime();

      acc[item.id] = item;

      return acc;
    }, {});

    sessionStorage.setItem('shared-workflows', JSON.stringify(sharedWorkflows));

    return sharedWorkflows;
  } catch (error) {
    console.error(error);

    return {};
  }
}
