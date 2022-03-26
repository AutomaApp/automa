import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

export default async function ({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
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
      nextBlockId,
      data: copiedText,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}
