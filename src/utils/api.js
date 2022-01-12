import secrets from 'secrets';

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
