import { IS_FIREFOX } from '@/common/utils/constant';
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { copyTextToClipboard } from '../helper';

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
  if (!IS_FIREFOX && !this.engine?.isPopup && !this.engine?.isMV2)
    throw new Error('Clipboard block is not supported in background execution');

  const permissions = ['clipboardRead'];
  if (IS_FIREFOX) {
    permissions.push('clipboardWrite');
  }

  const hasPermission = await BrowserAPIService.permissions.contains({
    permissions,
  });

  if (!hasPermission) {
    throw new Error('no-clipboard-acces');
  }

  let valueToReturn = '';

  if (!data.type || data.type === 'get') {
    const copiedText = doCommand('paste');
    valueToReturn = copiedText;

    if (data.assignVariable) {
      await this.setVariable(data.variableName, copiedText);
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

    if (IS_FIREFOX) {
      await copyTextToClipboard(text);
    } else {
      doCommand('copy', text);
    }
  }

  return {
    data: valueToReturn,
    nextBlockId: this.getBlockConnections(id),
  };
}
