import browser from 'webextension-polyfill';

const getFileExtension = (str) => /(?:\.([^.]+))?$/.exec(str)[1];
function determineFilenameListener(item, suggest) {
  const filesname =
    JSON.parse(sessionStorage.getItem('rename-downloaded-files')) || {};
  const suggestion = filesname[item.id];

  if (!suggestion) return true;

  const hasFileExt = getFileExtension(suggestion.filename);

  if (!hasFileExt) {
    const filExtension = getFileExtension(item.filename);
    suggestion.filename += `.${filExtension}`;
  }

  if (!suggestion.waitForDownload) delete filesname[item.id];

  sessionStorage.setItem('rename-downloaded-files', JSON.stringify(filesname));

  suggest({
    filename: suggestion.filename,
    conflictAction: suggestion.onConflict,
  });

  return false;
}

async function handleDownload({ data, id: blockId }) {
  const nextBlockId = this.getBlockConnections(blockId);
  const getFilesname = () =>
    JSON.parse(sessionStorage.getItem('rename-downloaded-files')) || {};

  let downloadId = null;
  if (data.downloadId?.trim()) {
    if (Number.isNaN(+data.downloadId))
      throw new Error('Download id is not a number');

    const [downloadItem] = await browser.downloads.search({
      id: +data.downloadId,
    });
    if (!downloadItem)
      throw new Error(`Can't find download item with ${data.downloadId} id`);

    if (downloadItem.state === 'complete') {
      if (data.saveData) {
        this.addDataToColumn(data.dataColumn, downloadItem.filename);
      }
      if (data.assignVariable) {
        this.setVariable(data.variableName, downloadItem.filename);
      }

      return {
        nextBlockId,
        data: downloadItem.filename,
      };
    }

    downloadId = +data.downloadId;
  }

  const result = await new Promise((resolve) => {
    if (!this.activeTab.id) throw new Error('no-tab');

    const hasListener =
      BROWSER_TYPE === 'chrome' &&
      chrome.downloads.onDeterminingFilename.hasListeners(() => {});
    if (!hasListener) {
      chrome.downloads.onDeterminingFilename.addListener(
        determineFilenameListener
      );
    }

    const handleCreated = ({ id }) => {
      if (downloadId) return;

      const names = getFilesname();

      downloadId = id;
      names[id] = data;
      sessionStorage.setItem('rename-downloaded-files', JSON.stringify(names));

      browser.downloads.onCreated.removeListener(handleCreated);
    };
    if (!downloadId) {
      browser.downloads.onCreated.addListener(handleCreated);
    }

    if (!data.waitForDownload) {
      resolve({
        nextBlockId,
        data: data.filename,
      });

      return;
    }

    let isResolved = false;
    let currentFilename = data.filename;

    const timeout = setTimeout(() => {
      if (isResolved) return;

      isResolved = true;

      resolve({
        nextBlockId,
        data: currentFilename,
      });
    }, data.timeout);

    const resolvePromise = (id) => {
      if (data.saveData) {
        this.addDataToColumn(data.dataColumn, currentFilename);
      }
      if (data.assignVariable) {
        this.setVariable(data.variableName, currentFilename);
      }

      clearTimeout(timeout);
      isResolved = true;

      const filesname = getFilesname();
      delete filesname[id];
      sessionStorage.setItem(
        'rename-downloaded-files',
        JSON.stringify(filesname)
      );

      chrome.downloads.onDeterminingFilename.removeListener(
        determineFilenameListener
      );

      resolve({
        nextBlockId,
        data: currentFilename,
      });
    };

    const handleChanged = ({ state, id, filename }) => {
      if (this.engine.isDestroyed || isResolved) {
        browser.downloads.onChanged.removeListener(handleChanged);
        return;
      }

      if (downloadId !== id || !state) return;

      if (filename) currentFilename = filename.current;

      const DOWNLOAD_STATE = ['complete', 'interrupted'];
      if (DOWNLOAD_STATE.includes(state.current)) {
        resolvePromise(id);
      } else {
        browser.downloads.search({ id: downloadId }).then(([download]) => {
          if (!download || !DOWNLOAD_STATE.includes(download.state)) return;

          resolvePromise(id);
        });
      }
    };

    browser.downloads.onChanged.addListener(handleChanged);
  });

  return result;
}

export default handleDownload;
