import browser from 'webextension-polyfill';
import { sendDebugCommand, checkCSPAndInject } from '../helper';

const overwriteDialog = (accept, promptText) => `
  const realConfirm = window.confirm;
  window.confirm = function() {
    return ${accept};
  };

  const realAlert = window.alert;
  window.alert = function() {
    return ${accept};
  };

  const realPrompt = window.prompt;
  window.prompt = function() {
    return ${accept} ? "${promptText}" : null;
  }
`;

async function handleDialog({ data, id: blockId }) {
  if (!this.settings.debugMode || BROWSER_TYPE !== 'chrome') {
    const isScriptExist = this.preloadScripts.some(({ id }) => id === blockId);

    if (!isScriptExist) {
      const jsCode = overwriteDialog(data.accept, data.promptText);
      const payload = {
        id: blockId,
        isBlock: true,
        name: 'javascript-code',
        isPreloadScripts: true,
        data: {
          everyNewTab: true,
          scripts: [{ data: { code: jsCode }, id: blockId }],
        },
      };

      if (this.engine.isMV2) {
        this.preloadScripts.push(payload);
        await this._sendMessageToTab(payload, {}, true);
      } else {
        const target = { tabId: this.activeTab.id, allFrames: true };
        const { debugMode } = this.engine.workflow.settings;
        const cspResult = await checkCSPAndInject(
          {
            target,
            debugMode,
            injectOptions: {
              injectImmediately: true,
            },
          },
          () => jsCode
        );
        if (!cspResult.isBlocked) {
          await browser.scripting.executeScript({
            target,
            args: [data],
            world: 'MAIN',
            injectImmediately: true,
            func: (blockData) => {
              window.confirm = function () {
                return blockData.accept;
              };

              window.alert = function () {
                return blockData.accept;
              };

              window.prompt = function () {
                return blockData.accept ? blockData.promptText : null;
              };
            },
          });
        }
      }
    }
  } else {
    this.dialogParams = {
      accept: data.accept,
      promptText: data.promptText,
    };

    const methodName = 'Page.javascriptDialogOpening';
    if (!this.engine.eventListeners[methodName]) {
      this.engine.on(methodName, () => {
        sendDebugCommand(
          this.activeTab.id,
          'Page.handleJavaScriptDialog',
          this.dialogParams
        );
      });
    }
  }

  return {
    data: '',
    nextBlockId: this.getBlockConnections(blockId),
  };
}

export default handleDialog;
