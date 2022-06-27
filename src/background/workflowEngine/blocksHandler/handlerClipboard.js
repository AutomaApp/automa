import browser from 'webextension-polyfill';

export default async function ({ data, id }) {
  const hasPermission = await browser.permissions.contains({
    permissions: ['clipboardRead'],
  });

  if (!hasPermission) {
    throw new Error('no-clipboard-acces');
  }

  const textarea = document.createElement('textarea');
  document.body.appendChild(textarea);
  textarea.focus();
  document.execCommand('paste');

  const copiedText = textarea.value;

  if (data.assignVariable) {
    this.setVariable(data.variableName, copiedText);
  }
  if (data.saveData) {
    this.addDataToColumn(data.dataColumn, copiedText);
  }

  document.body.removeChild(textarea);

  return {
    data: copiedText,
    nextBlockId: this.getBlockConnections(id),
  };
}
