import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

function handleDownload({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });
  const getFilesname = () =>
    JSON.parse(sessionStorage.getItem('rename-downloaded-files')) || {};

  return new Promise((resolve) => {
    if (!this.activeTab.id) throw new Error('no-tab');

    const names = getFilesname();
    const { origin } = new URL(this.activeTab.url);

    names[origin] = data;
    sessionStorage.setItem('rename-downloaded-files', JSON.stringify(names));

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

    const resolvePromise = () => {
      if (data.saveData) {
        this.addDataToColumn(data.dataColumn, currentFilename);
      }
      if (data.assignVariable) {
        this.referenceData.variables[data.variableName] = currentFilename;
      }

      clearTimeout(timeout);
      isResolved = true;

      const filesname = getFilesname();
      delete filesname[origin];
      sessionStorage.setItem(
        'rename-downloaded-files',
        JSON.stringify(filesname)
      );

      resolve({
        nextBlockId,
        data: currentFilename,
      });
    };

    const handleChanged = ({ state, id, filename }) => {
      if (this.isDestroyed || isResolved) {
        browser.downloads.onChanged.removeListener(handleChanged);
        return;
      }

      const file = getFilesname()[origin];
      if (!file || file.id !== id) return;

      if (filename) currentFilename = filename.current;

      if (state && state.current === 'complete') {
        resolvePromise();
      } else {
        browser.downloads.search({ id }).then(([download]) => {
          if (!download || !download.endTime) return;

          resolvePromise();
        });
      }
    };
    browser.downloads.onChanged.addListener(handleChanged);
  });
}

export default handleDownload;
