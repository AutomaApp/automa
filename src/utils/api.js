import secrets from 'secrets';

export function fetchApi(path, options) {
  const urlPath = path.startsWith('/') ? path : `/${path}`;

  return fetch(`${secrets.baseApiUrl}${urlPath}`, options);
}

export function getGoogleSheetsValue(spreadsheetId, range) {
  const url = `/services/google-sheets?spreadsheetId=${spreadsheetId}&range=${range}`;

  return fetchApi(url);
}
