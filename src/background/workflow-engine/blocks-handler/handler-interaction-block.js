import browser from 'webextension-polyfill';
import { objectHasKey } from '@/utils/helper';
import { getBlockConnection } from '../helper';

async function checkAccess(blockName) {
  if (blockName === 'upload-file') {
    const hasFileAccess = await new Promise((resolve) =>
      chrome.extension.isAllowedFileSchemeAccess(resolve)
    );

    if (hasFileAccess) return true;

    throw new Error('no-file-access');
  } else if (blockName === 'clipboard') {
    const hasPermission = await browser.permissions.contains({
      permissions: ['clipboardRead'],
    });

    if (!hasPermission) {
      throw new Error('no-clipboard-acces');
    }
  }

  return true;
}

async function interactionHandler(block) {
  await checkAccess(block.name);

  const nextBlockId = getBlockConnection(block);

  try {
    const data = await this._sendMessageToTab(block, {
      frameId: this.activeTab.frameId || 0,
    });

    if (
      (block.data.saveData && block.name !== 'forms') ||
      block.data.getValue
    ) {
      const currentColumnType =
        this.columns[block.data.dataColumn]?.type || 'any';
      const insertDataToColumn = (value) => {
        this.addDataToColumn(block.data.dataColumn, value);

        const addExtraRow =
          objectHasKey(block.data, 'extraRowDataColumn') &&
          block.data.addExtraRow;
        if (addExtraRow) {
          this.addDataToColumn(
            block.data.extraRowDataColumn,
            block.data.extraRowValue
          );
        }
      };

      if (Array.isArray(data) && currentColumnType !== 'array') {
        data.forEach((value) => {
          insertDataToColumn(value);
        });
      } else {
        insertDataToColumn(data);
      }
    }

    if (block.data.assignVariable) {
      this.setVariable(block.data.variableName, data);
    }

    return {
      data,
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;
    error.data = {
      name: block.name,
      selector: block.data.selector,
    };

    throw error;
  }
}

export default interactionHandler;
