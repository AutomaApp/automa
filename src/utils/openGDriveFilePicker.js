import secrets from 'secrets';
import browser from 'webextension-polyfill';

function injectFilePicker() {
  return new Promise((resolve, reject) => {
    const scriptExist = document.querySelector('#google-api');
    if (scriptExist) {
      resolve();
      return;
    }

    let gisLoaded = false;
    let pickerLoaded = false;

    const scriptApi = document.createElement('script');
    scriptApi.onload = () => {
      window.gapi.load('picker', () => {
        pickerLoaded = true;
      });
    };
    scriptApi.id = 'google-api';
    scriptApi.src = 'https://apis.google.com/js/api.js';

    const scriptGis = document.createElement('script');
    scriptGis.onload = () => {
      gisLoaded = true;
    };
    scriptGis.src = 'https://accounts.google.com/gsi/client';

    document.body.appendChild(scriptApi);
    document.body.appendChild(scriptGis);

    let count = 0;
    const checkIfLoaded = () => {
      if (count > 10) {
        reject(new Error('Timeout'));
        return;
      }

      if (gisLoaded && pickerLoaded) {
        resolve();
        return;
      }

      count += 1;
      setTimeout(checkIfLoaded, 1500);
    };

    checkIfLoaded();
  });
}

function selectFile(accessToken) {
  return new Promise((resolve) => {
    const callback = (event) => {
      if (!event || event?.action !== 'picked') return;

      const [doc] = event.docs;
      resolve(doc);
    };

    const picker = new window.google.picker.PickerBuilder()
      .addView(
        new window.google.picker.DocsView(
          window.google.picker.ViewId.SPREADSHEETS
        ).setMode(window.google.picker.DocsViewMode.LIST)
      )
      .setAppId(secrets.googleProjectId)
      .setOAuthToken(accessToken)
      .setDeveloperKey(secrets.googleApiKey)
      .setCallback(callback)
      .build();
    picker.setVisible(true);

    window.gDrivePicker = picker;
  });
}

export default async function () {
  await injectFilePicker();

  const { sessionToken, session } = await browser.storage.local.get([
    'sessionToken',
    'session',
  ]);
  if (!sessionToken || !sessionToken.access) return null;

  const isGoogleProvider =
    session?.user?.user_metadata?.iss.includes('google.com');
  if (!isGoogleProvider) return null;

  const result = await selectFile(sessionToken.access);

  return result;
}
