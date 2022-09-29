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
}

export default BackgroundRecordWorkflow;
