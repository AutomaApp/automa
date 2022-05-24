import browser from 'webextension-polyfill';

export default async function (detail, save = true) {
  const { isRecording, recording } = await browser.storage.local.get([
    'isRecording',
    'recording',
  ]);

  if (!isRecording || !recording) return null;

  let addedBlock = detail;

  if (typeof detail === 'function') addedBlock = detail(recording);
  else recording.flows.push(detail);

  if (save) await browser.storage.local.set({ recording });

  return { recording, addedBlock };
}
