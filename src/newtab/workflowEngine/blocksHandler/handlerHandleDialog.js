import { sendDebugCommand } from '../helper';

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
      const payload = {
        id: blockId,
        isBlock: true,
        name: 'javascript-code',
        data: {
          everyNewTab: true,
          code: overwriteDialog(data.accept, data.promptText),
        },
      };

      this.preloadScripts.push(payload);
      await this._sendMessageToTab(payload, {}, true);
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
