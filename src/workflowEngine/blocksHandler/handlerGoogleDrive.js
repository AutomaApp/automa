import { fetchGapi, validateOauthToken } from '@/utils/api';
import getFile from '@/utils/getFile';
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import renderString from '../templating/renderString';

function getFilename(url) {
  try {
    const filename = new URL(url).pathname.split('/').pop();
    const hasExtension = /\.[0-9a-z]+$/i.test(filename);

    if (!hasExtension) return null;

    return filename;
  } catch (e) {
    return null;
  }
}

export async function googleDrive({ id, data }, { refData }) {
  const { sessionToken } = await BrowserAPIService.storage.local.get(
    'sessionToken'
  );
  if (!sessionToken) throw new Error("You haven't connect Google Drive");

  await validateOauthToken();

  const resultPromise = data.filePaths.map(async (item) => {
    let path = (await renderString(item.path, refData, this.engine.isPopup))
      .value;
    if (item.type === 'downloadId') {
      const [downloadItem] = await BrowserAPIService.downloads.search({
        id: +path,
        exists: true,
        state: 'complete',
      });
      if (!downloadItem || !downloadItem.filename)
        throw new Error(`Can't find download item with "${item.path}" id`);

      path = downloadItem.filename;
    }

    const name =
      (await renderString(item.name || '', refData, this.engine.isPopup))
        .value || getFilename(path);

    const blob = await getFile(path, { returnValue: true });
    const { response: sessionResponse } = await fetchGapi(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          mimeType: blob.type,
        }),
      },
      { response: true }
    );
    const locationUri = sessionResponse.headers.get('location');

    const buffer = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result);
      };
      reader.readAsArrayBuffer(blob);
    });

    const result = await fetchGapi(locationUri, {
      method: 'PUT',
      headers: {
        'Content-Length': blob.size,
      },
      body: buffer,
    });

    return result;
  });
  const result = await Promise.all(resultPromise);

  return {
    data: result,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default googleDrive;
