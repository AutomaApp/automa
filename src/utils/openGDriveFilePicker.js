import browser from 'webextension-polyfill';

/**
 *
 * get all google sheets files in current user's google drive
 * @returns {Promise<Array>} file list [{ id, name, mimeType }]
 */
export default async function fetchGDriveSheets() {
  const { sessionToken, session } = await browser.storage.local.get([
    'sessionToken',
    'session',
  ]);
  if (!sessionToken || !sessionToken.access) return [];

  const isGoogleProvider =
    session?.user?.user_metadata?.iss.includes('google.com');
  if (!isGoogleProvider) return [];

  const accessToken = sessionToken.access;
  const endpoint =
    'https://www.googleapis.com/drive/v3/files?fields=files(id%2Cname%2CmimeType)&q=mimeType%3D%27application%2Fvnd.google-apps.spreadsheet%27&spaces=drive&pageSize=1000';

  try {
    const res = await fetch(endpoint, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    if (!res.ok) throw new Error('Failed to fetch Google Sheets list');
    const data = await res.json();
    return data.files || [];
  } catch (e) {
    // handle token expired or other exceptions
    return [];
  }
}

/**
 * open google picker popup to get user authorized file
 * @param {string} accessToken
 * @returns {Promise<{id, name, mimeType}>}
 */
export function openGDrivePickerPopup(accessToken) {
  return new Promise((resolve, reject) => {
    const pickerUrl = `https://extension.automa.site/picker?access_token=${accessToken}`;
    const popup = window.open(pickerUrl, '_blank', 'width=600,height=600');
    function handleMessage(event) {
      if (!event.origin.startsWith('https://extension.automa.site')) return;
      if (event.data && event.data.type === 'GDRIVE_PICKER_RESULT') {
        window.removeEventListener('message', handleMessage);
        popup.close();
        resolve(event.data.file);
      }
    }
    window.addEventListener('message', handleMessage);
    const timer = setInterval(() => {
      if (popup.closed) {
        clearInterval(timer);
        window.removeEventListener('message', handleMessage);
        reject(new Error('Picker window closed'));
      }
    }, 500);
  });
}
