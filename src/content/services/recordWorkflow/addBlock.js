import browser from 'webextension-polyfill';

export default async function (detail) {
  const { isRecording, recording } = await browser.storage.local.get([
    'isRecording',
    'recording',
  ]);

  if (!isRecording || !recording) return;

  if (typeof detail === 'function') detail(recording);
  else recording.flows.push(detail);

  await browser.storage.local.set({ recording });
}
