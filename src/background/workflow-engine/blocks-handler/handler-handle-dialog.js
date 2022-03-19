import { getBlockConnection, sendDebugCommand } from '../helper';

function handleDialog({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  return new Promise((resolve, reject) => {
    if (!this.workflow.settings.debugMode) {
      const error = new Error('not-debug-mode');
      error.nextBlockId = nextBlockId;

      reject(error);
      return;
    }

    this.dialogParams = {
      accept: data.accept,
      promptText: data.promptText,
    };

    const methodName = 'Page.javascriptDialogOpening';
    if (!this.eventListeners[methodName]) {
      this.on(methodName, () => {
        sendDebugCommand(
          this.activeTab.id,
          'Page.handleJavaScriptDialog',
          this.dialogParams
        );
      });
    }

    resolve({
      data: '',
      nextBlockId,
    });
  });
}

export default handleDialog;
