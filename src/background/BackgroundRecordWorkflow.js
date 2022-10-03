import browser from 'webextension-polyfill';

class BackgroundRecordWorkflow {
  static async checkRecording(tabId, tabUrl) {
    if (!tabUrl.startsWith('http')) return;

    const { isRecording } = await browser.storage.local.get('isRecording');
    if (!isRecording) return;

    await browser.scripting.executeScript({
      target: {
        tabId,
        allFrames: true,
      },
      files: ['recordWorkflow.bundle.js'],
    });
  }

  static async updateRecording(callback) {
    const { isRecording, recording } = await browser.storage.local.get([
      'isRecording',
      'recording',
    ]);

    if (!isRecording || !recording) return;

    callback(recording);

    await browser.storage.local.set({ recording });
  }
}

export default BackgroundRecordWorkflow;
