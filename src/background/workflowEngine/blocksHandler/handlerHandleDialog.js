import { getBlockConnection, sendDebugCommand } from '../helper';

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

function handleDialog({ data, outputs, id: blockId }) {
  const nextBlockId = getBlockConnection({ outputs });

  return new Promise((resolve) => {
    if (!this.settings.debugMode || BROWSER_TYPE !== 'chrome') {
      const isScriptExist = this.preloadScripts.find(
        ({ id }) => id === blockId
      );

      if (!isScriptExist) {
        this.preloadScripts.push({
          id: blockId,
          isBlock: true,
          name: 'javascript-code',
          data: {
            everyNewTab: true,
            code: overwriteDialog(data.accept, data.promptText),
          },
        });
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

    resolve({
      data: '',
      nextBlockId,
    });
  });
}

export default handleDialog;
