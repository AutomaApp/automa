import browser from 'webextension-polyfill';

const checkPermissions = (permissions) =>
  browser.permissions.contains({ permissions });
const isEmptyStr = (str) => !str.trim();
const isFirefox = BROWSER_TYPE === 'firefox';
const defaultOptions = {
  once: false,
};

export async function validateTrigger(data) {
  const errors = [];
  const checkValue = (value, { name, location }) => {
    if (value && value.trim()) return;

    errors.push(`"${name}" is empty in the ${location}`);
  };
  const triggersValidation = {
    'cron-job': (triggerData) => {
      checkValue(triggerData.expression, {
        name: 'Expression',
        location: 'Cron job trigger',
      });
    },
    'context-menu': async (triggerData) => {
      const permission = isFirefox ? 'menus' : 'contextMenus';
      const hasPermission = await checkPermissions([permission]);

      if (!hasPermission) {
        errors.push(
          "Doesn't have permission for the Context menu trigger (ignore if you already grant the permissions)"
        );
      } else {
        checkValue(triggerData.contextMenuName, {
          name: 'Context menu name',
          location: 'Context menu trigger',
        });
      }
    },
    date: (triggerData) => {
      checkValue(triggerData.date, {
        name: 'Date',
        location: 'On a specific date tigger',
      });
    },
    'visit-web': (triggerData) => {
      checkValue(triggerData.url, {
        name: 'URL',
        location: 'Visit web trigger',
      });
    },
    'keyboard-shortcut': (triggerData) => {
      checkValue(triggerData.shortcut, {
        name: 'Shortcut',
        location: 'Shortcut trigger',
      });
    },
  };

  if (data.triggers) {
    for (const trigger of data.triggers) {
      const validate = triggersValidation[trigger.type];
      if (validate) await validate(trigger.data);
    }
  } else {
    const validate = triggersValidation[data.type];
    if (validate) await validate(data);
  }

  return errors;
}

export async function validateExecuteWorkflow(data) {
  if (isEmptyStr(data.workflowId)) return ['No workflow selected'];

  return [];
}

export async function validateNewTab(data) {
  if (isEmptyStr(data.url)) return ['URL is empty'];

  return [];
}

export async function validateSwitchTab(data) {
  const errors = [];
  const validateItems = {
    'match-patterns': () => {
      if (isEmptyStr(data.matchPattern))
        errors.push('The Match patterns is empty');
    },
    'tab-title': () => {
      if (isEmptyStr(data.tabTitle)) errors.push('The Tab title is empty');
    },
  };

  if (validateItems[data.findTabBy]) validateItems[data.findTabBy]();

  return errors;
}

export async function validateProxy(data) {
  if (isEmptyStr(data.host)) return ['The Host is empty'];

  return [];
}

export async function validateCloseTab(data) {
  if (data.closeType === 'tab' && !data.activeTab && isEmptyStr(data.url)) {
    return ['The Match patterns is empty'];
  }

  return [];
}

export async function validateTakeScreenshot(data) {
  if (data.type === 'element' && isEmptyStr(data.selector)) {
    return ['The CSS selector is empty'];
  }

  return [];
}

export async function validateInteractionBasic(data) {
  if (isEmptyStr(data.selector)) return ['The Selector is empty'];

  return [];
}

export async function validateExportData(data) {
  const errors = [];

  const hasPermission = await checkPermissions(['downloads']);
  if (!hasPermission)
    errors.push(
      "Don't have download permission (ignore if you already grant the permissions)"
    );

  if (data.dataToExport === 'variable' && isEmptyStr(data.variableName)) {
    errors.push('The Variable name is empty');
  } else if (data.dataToExport === 'google-sheets' && isEmptyStr(data.refKey)) {
    errors.push('The Reference key is empty');
  }

  return errors;
}

export async function validateAttributeValue(data) {
  const errors = [];

  if (isEmptyStr(data.selector)) errors.push('The Selector is empty');
  if (isEmptyStr(data.attributeName))
    errors.push('The Attribute name is empty');

  return errors;
}

export async function validateGoogleSheets(data) {
  const errors = [];

  if (isEmptyStr(data.spreadsheetId))
    errors.push('The Spreadsheet Id is empty');
  if (isEmptyStr(data.range)) errors.push('The Range is empty');

  return errors;
}

export async function validateWebhook(data) {
  if (isEmptyStr(data.url)) return ['The URL is empty'];

  return [];
}

export async function validateLoopData(data) {
  const errors = [];
  if (isEmptyStr(data.loopId)) errors.push('The Loop id is empty');

  const loopThroughItems = {
    'google-sheets': () => {
      if (isEmptyStr(data.referenceKey))
        errors.push('The Reference key is empty');
    },
    variable: () => {
      if (isEmptyStr(data.variableName))
        errors.push('The Variable name is empty');
    },
  };
  const validateItem = loopThroughItems[data.loopThrough];
  if (validateItem) validateItem();

  return errors;
}

export async function validateLoopElements(data) {
  const errors = [];
  if (isEmptyStr(data.loopId)) errors.push('The Loop id is empty');
  if (isEmptyStr(data.selector)) errors.push('The Selector is empty');

  if (
    ['click-element', 'click-link'].includes(data.loadMoreAction) &&
    isEmptyStr(data.actionElSelector)
  ) {
    errors.push('The Selector for loading more elements is empty');
  }

  return errors;
}

export async function validateClipboard() {
  const permissions = isFirefox
    ? ['clipboardRead', 'clipboardWrite']
    : ['clipboardRead'];
  const hasPermission = await checkPermissions(permissions);

  if (!hasPermission)
    return [
      "Don't have permission to access the clipboard (ignore if you already grant the permissions)",
    ];

  return [];
}

export async function validateSwitchTo(data) {
  if (data.windowType === 'iframe' && isEmptyStr(data.selector)) {
    return ['The Selector for Iframe is empty'];
  }

  return [];
}

export async function validateUploadFile(data) {
  const errors = [];

  if (isEmptyStr(data.selector)) errors.push('The Selector is empty');

  const someInputsEmpty = data.filePaths.some((path) => isEmptyStr(path));
  if (someInputsEmpty) errors.push('Some of the file paths is empty');

  return errors;
}

export async function validateSaveAssets(data) {
  const errors = [];

  const hasPermission = await checkPermissions(['downloads']);
  if (!hasPermission)
    errors.push(
      "Don't have download permission (ignore if you already grant the permissions)"
    );
  else if (isEmptyStr(data.selector)) errors.push('The Selector is empty');

  return errors;
}

export async function validatePressKey(data) {
  const errors = [];

  if (isEmptyStr(data.selector)) errors.push('The Selector is empty');

  const isKeyEmpty =
    !data.action || (data.action === 'press-key' && isEmptyStr(data.keys));
  const isMultipleKeysEmpty =
    data.action === 'multiple-keys' && isEmptyStr(data.keysToPress);
  if (isKeyEmpty || isMultipleKeysEmpty)
    errors.push('The Keys to press is empty');

  return errors;
}

export async function validateNotification() {
  const hasPermission = await checkPermissions(['notifications']);
  if (!hasPermission) return ["Don't have notifications permissions"];

  return [];
}

export default {
  trigger: {
    ...defaultOptions,
    func: validateTrigger,
  },
  'execute-workflow': {
    ...defaultOptions,
    func: validateExecuteWorkflow,
  },
  'new-tab': {
    ...defaultOptions,
    func: validateNewTab,
  },
  'switch-tab': {
    ...defaultOptions,
    func: validateSwitchTab,
  },
  proxy: {
    ...defaultOptions,
    func: validateProxy,
  },
  'close-tab': {
    ...defaultOptions,
    func: validateCloseTab,
  },
  'take-screenshot': {
    ...defaultOptions,
    func: validateTakeScreenshot,
  },
  'event-click': {
    ...defaultOptions,
    func: validateInteractionBasic,
  },
  'get-text': {
    ...defaultOptions,
    func: validateInteractionBasic,
  },
  'export-data': {
    ...defaultOptions,
    func: validateExportData,
  },
  'element-scroll': {
    ...defaultOptions,
    func: validateInteractionBasic,
  },
  link: {
    ...defaultOptions,
    func: validateInteractionBasic,
  },
  'attribute-value': {
    ...defaultOptions,
    func: validateAttributeValue,
  },
  forms: {
    ...defaultOptions,
    func: validateInteractionBasic,
  },
  'trigger-event': {
    ...defaultOptions,
    func: validateInteractionBasic,
  },
  'google-sheets': {
    ...defaultOptions,
    func: validateGoogleSheets,
  },
  'element-exists': {
    ...defaultOptions,
    func: validateInteractionBasic,
  },
  webhook: {
    ...defaultOptions,
    func: validateWebhook,
  },
  'loop-data': {
    ...defaultOptions,
    func: validateLoopData,
  },
  'loop-elements': {
    ...defaultOptions,
    func: validateLoopElements,
  },
  clipboard: {
    ...defaultOptions,
    once: true,
    func: validateClipboard,
  },
  'switch-to': {
    ...defaultOptions,
    func: validateSwitchTo,
  },
  'upload-file': {
    ...defaultOptions,
    func: validateUploadFile,
  },
  'hover-element': {
    ...defaultOptions,
    func: validateInteractionBasic,
  },
  'save-assets': {
    ...defaultOptions,
    func: validateSaveAssets,
  },
  'press-key': {
    ...defaultOptions,
    func: validatePressKey,
  },
  notification: {
    ...defaultOptions,
    func: validateNotification,
  },
  'create-element': {
    ...defaultOptions,
    func: validateInteractionBasic,
  },
};
