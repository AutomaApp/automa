import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { MessageListener } from '@/utils/message';
import browser from 'webextension-polyfill';

const DOWNLOADS_STORAGE_KEY = 'automa-rename-downloaded-files';

/**
 *
 * @returns {Promise<Object>}
 */
async function getDownloadFilesFromStorage() {
  try {
    const result = await browser.storage.session.get(DOWNLOADS_STORAGE_KEY);
    return result[DOWNLOADS_STORAGE_KEY] || {};
  } catch (error) {
    console.error('Failed to get downloads from storage:', error);
    return {};
  }
}

/**
 *
 * @param {Object} filesData
 */
async function saveDownloadFilesToStorage(filesData) {
  try {
    await browser.storage.session.set({
      [DOWNLOADS_STORAGE_KEY]: filesData,
    });
  } catch (error) {
    console.error('Failed to save downloads to storage:', error);
  }
}

/**
 *
 * @param {number} downloadId
 */
async function removeDownloadFromStorage(downloadId) {
  try {
    const filesData = await getDownloadFilesFromStorage();
    delete filesData[downloadId];
    await saveDownloadFilesToStorage(filesData);
  } catch (error) {
    console.error('Failed to remove download from storage:', error);
  }
}

/**
 * env: background
 */
async function registerDownloadListeners() {
  try {
    const hasPermission = await BrowserAPIService.permissions.contains({
      permissions: ['downloads'],
    });

    if (!hasPermission) {
      const granted = await BrowserAPIService.permissions.request({
        permissions: ['downloads'],
      });
      if (!granted) {
        throw new Error('Download feature requires download permission');
      }
    }

    return MessageListener.sendMessage(
      'downloads:register-listeners',
      null,
      'background'
    );
  } catch (error) {
    console.error('Failed to register download listeners:', error);

    throw error;
  }
}

async function handleDownload({ data, id: blockId }) {
  const nextBlockId = this.getBlockConnections(blockId);

  try {
    const hasPermission = await BrowserAPIService.permissions.contains({
      permissions: ['downloads'],
    });
    if (!hasPermission) {
      const granted = await BrowserAPIService.permissions.request({
        permissions: ['downloads'],
      });
      if (!granted) {
        throw new Error('Download feature requires download permission');
      }
    }

    const processedData = {
      ...data,
      filename: data.filename?.trim() || '',
    };

    let downloadId = null;
    if (processedData.downloadId?.trim()) {
      if (Number.isNaN(+processedData.downloadId))
        throw new Error('Download id is not a number');

      const [downloadItem] = await BrowserAPIService.downloads.search({
        id: +processedData.downloadId,
      });

      if (!downloadItem)
        throw new Error(
          `Can't find download item with ${processedData.downloadId} id`
        );

      if (downloadItem.state === 'complete') {
        if (processedData.saveData) {
          this.addDataToColumn(processedData.dataColumn, downloadItem.filename);
        }
        if (processedData.assignVariable) {
          await this.setVariable(
            processedData.variableName,
            downloadItem.filename
          );
        }

        return {
          nextBlockId,
          data: downloadItem.filename,
        };
      }

      downloadId = +processedData.downloadId;
    }

    await registerDownloadListeners();

    const result = await new Promise((resolve) => {
      if (!this.activeTab.id) throw new Error('no-tab');

      (async () => {
        try {
          if (!downloadId) {
            const downloadCompletePromise = new Promise((completeResolve) => {
              MessageListener.sendMessage(
                'downloads:watch-created',
                {
                  downloadData: processedData,
                  tabId: this.activeTab.id,

                  onComplete: (response) => {
                    completeResolve(response);
                  },
                },
                'background'
              ).catch((err) => {
                completeResolve({ error: true, message: err.message });
              });
            });

            if (!processedData.waitForDownload) {
              resolve({
                nextBlockId,
                data: processedData.filename,
              });
              return;
            }

            const timeoutPromise = new Promise((timeoutResolve) => {
              setTimeout(() => {
                timeoutResolve({
                  timedOut: true,
                  filename: processedData.filename,
                });
              }, processedData.timeout);
            });

            const downloadResult = await Promise.race([
              downloadCompletePromise,
              timeoutPromise,
            ]);

            let finalFilename = processedData.filename;
            if (downloadResult.filename) {
              finalFilename = downloadResult.filename;
            }

            if (processedData.saveData) {
              this.addDataToColumn(processedData.dataColumn, finalFilename);
            }
            if (processedData.assignVariable) {
              await this.setVariable(processedData.variableName, finalFilename);
            }

            resolve({
              nextBlockId,
              data: finalFilename,
            });
          } else {
            const filesData = await getDownloadFilesFromStorage();
            filesData[downloadId] = processedData;
            await saveDownloadFilesToStorage(filesData);

            if (!processedData.waitForDownload) {
              resolve({
                nextBlockId,
                data: processedData.filename,
              });
              return;
            }

            let isResolved = false;
            let currentFilename = processedData.filename;

            const timeout = setTimeout(() => {
              if (isResolved) return;
              isResolved = true;

              resolve({
                nextBlockId,
                data: currentFilename,
              });
            }, processedData.timeout);

            await MessageListener.sendMessage(
              'downloads:watch-changed',
              {
                downloadId,
                tabId: this.activeTab.id,
                onComplete: async (response) => {
                  try {
                    if (isResolved) return;

                    if (response.filename) {
                      currentFilename = response.filename;
                    }

                    if (processedData.saveData) {
                      this.addDataToColumn(
                        processedData.dataColumn,
                        currentFilename
                      );
                    }
                    if (processedData.assignVariable) {
                      await this.setVariable(
                        processedData.variableName,
                        currentFilename
                      );
                    }

                    clearTimeout(timeout);
                    isResolved = true;

                    if (response.downloadId) {
                      await removeDownloadFromStorage(response.downloadId);
                    }

                    resolve({
                      nextBlockId,
                      data: currentFilename,
                    });
                  } catch (err) {
                    if (!isResolved) {
                      isResolved = true;
                      resolve({
                        nextBlockId,
                        data: { $error: true, message: err.message },
                      });
                    }
                  }
                },
              },
              'background'
            );
          }
        } catch (err) {
          resolve({
            nextBlockId,
            data: { $error: true, message: err.message },
          });
        }
      })().catch((err) => {
        resolve({
          nextBlockId,
          data: { $error: true, message: err.message },
        });
      });
    });

    return result;
  } catch (error) {
    return {
      nextBlockId,
      data: { $error: true, message: error.message },
    };
  }
}

export default handleDownload;
