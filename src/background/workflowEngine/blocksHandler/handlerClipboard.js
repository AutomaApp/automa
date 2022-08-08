import browser from 'webextension-polyfill';

function doCommand(command, value) {
  const textarea = document.createElement('textarea');
  document.body.appendChild(textarea);

  if (command === 'paste') {
    textarea.focus();
    document.execCommand('paste');
    value = textarea.value;
  } else if (command === 'copy') {
    textarea.value = value;
    textarea.select();
    document.execCommand('copy');
    textarea.blur();
  }

  textarea.remove();

  return value;
}

export default async function ({ data, id, label }) {
  const hasPermission = await browser.permissions.contains({
    permissions: ['clipboardRead'],
  });

  if (!hasPermission) {
    throw new Error('no-clipboard-acces');
  }

  let valueToReturn = '';

  if (!data.type || data.type === 'get') {
    const copiedText = doCommand('paste');
    valueToReturn = copiedText;

    if (data.assignVariable) {
      this.setVariable(data.variableName, copiedText);
    }
    if (data.saveData) {
      this.addDataToColumn(data.dataColumn, copiedText);
    }
  } else if (data.type === 'insert') {
    let text = '';

    if (data.copySelectedText) {
      if (!this.activeTab.id) throw new Error('no-tab');

      text = await this._sendMessageToTab({
        id,
        label,
      });
    } else {
      text = data.dataToCopy;
    }

    valueToReturn = text;
    doCommand('copy', text);
  }

  return {
    data: valueToReturn,
    nextBlockId: this.getBlockConnections(id),
  };
}
