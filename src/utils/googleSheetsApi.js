import { fetchGapi, fetchApi } from './api';

function queryBuilder(obj) {
  let str = '';

  Object.entries(obj).forEach(([key, value], index) => {
    if (index !== 0) str += `&`;

    str += `${key}=${value}`;
  });

  return str;
}

export const googleSheetNative = {
  getUrl(path) {
    return `https://sheets.googleapis.com/v4/spreadsheets${path}`;
  },
  getValues({ spreadsheetId, range }) {
    const url = googleSheetNative.getUrl(`/${spreadsheetId}/values/${range}`);

    return fetchGapi(url);
  },
  getRange({ spreadsheetId, range }) {
    const url = googleSheetNative.getUrl(
      `/${spreadsheetId}/values/${range}:append?valueInputOption=RAW&includeValuesInResponse=false&insertDataOption=INSERT_ROWS`
    );

    return fetchGapi(url, {
      method: 'POST',
    });
  },
  clearValues({ spreadsheetId, range }) {
    const url = googleSheetNative.getUrl(
      `/${spreadsheetId}/values/${range}:clear`
    );

    return fetchGapi(url, { method: 'POST' });
  },
  updateValues({ spreadsheetId, range, options, append }) {
    let url = '';
    let method = '';

    if (append) {
      url = googleSheetNative.getUrl(
        `/${spreadsheetId}/values/${range}:append`
      );
      method = 'POST';
    } else {
      url = googleSheetNative.getUrl(`/${spreadsheetId}/values/${range}`);
      method = 'PUT';
    }

    const payload = { method };
    if (options.body) payload.body = options.body;

    return fetchGapi(`${url}?${queryBuilder(options?.queries || {})}`, payload);
  },
  create(name) {
    const url = googleSheetNative.getUrl('');

    return fetchGapi(url, {
      method: 'POST',
      body: JSON.stringify({
        properties: {
          title: name,
        },
      }),
    });
  },
  addSheet({ sheetName, spreadsheetId }) {
    const url = googleSheetNative.getUrl(`/${spreadsheetId}:batchUpdate`);
    return fetchGapi(url, {
      method: 'POST',
      body: JSON.stringify({
        requests: [
          {
            addSheet: {
              properties: { title: sheetName },
            },
          },
        ],
      }),
    });
  },
};

export const googleSheets = {
  getUrl(spreadsheetId, range) {
    return `/services/google-sheets?spreadsheetId=${spreadsheetId}&range=${range}`;
  },
  getValues({ spreadsheetId, range }) {
    const url = this.getUrl(spreadsheetId, range);

    return fetchApi(url);
  },
  getRange({ spreadsheetId, range }) {
    return googleSheets.updateValues({
      range,
      append: true,
      spreadsheetId,
      options: {
        body: JSON.stringify({ values: [] }),
        queries: {
          valueInputOption: 'RAW',
          includeValuesInResponse: false,
          insertDataOption: 'INSERT_ROWS',
        },
      },
    });
  },
  clearValues({ spreadsheetId, range }) {
    return fetchApi(this.getUrl(spreadsheetId, range), {
      method: 'DELETE',
    });
  },
  updateValues({ spreadsheetId, range, options = {}, append }) {
    const url = `${this.getUrl(spreadsheetId, range)}&${queryBuilder(
      options?.queries || {}
    )}`;

    return fetchApi(url, {
      ...options,
      method: append ? 'POST' : 'PUT',
    });
  },
};

export default function (isDriveSheet = false) {
  return isDriveSheet ? googleSheetNative : googleSheets;
}
