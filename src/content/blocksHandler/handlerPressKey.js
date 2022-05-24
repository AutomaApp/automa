import { isXPath } from '@/utils/helper';
import { sendMessage } from '@/utils/message';
import { keyDefinitions } from '@/utils/USKeyboardLayout';
import { queryElements } from '../handleSelector';

const textFieldTags = ['INPUT', 'TEXTAREA'];
const modifierKeys = [
  { name: 'Alt', id: 1 },
  { name: 'Meta', id: 4 },
  { name: 'Shift', id: 8 },
  { name: 'Control', id: 2 },
];

function pressKeyWithJs(element, keys) {
  const details = {
    key: '',
    code: '',
    keyCode: '',
    bubbles: true,
    altKey: false,
    metaKey: false,
    ctrlKey: false,
    shiftKey: false,
    cancelable: true,
  };

  ['keydown', 'keyup'].forEach((event) => {
    keys.forEach((key) => {
      const isLetter = /^[a-zA-Z]$/.test(key);

      const isModKey = modifierKeys.some(({ name }) => name === key);
      const dispatchEvent = () => {
        const keyDefinition = keyDefinitions[key] || {
          key,
          keyCode: 0,
          code: isLetter ? `Key${key}` : key,
        };
        const keyboardEvent = new KeyboardEvent(event, {
          ...details,
          ...keyDefinition,
        });

        element.dispatchEvent(keyboardEvent);
      };

      if (isModKey) {
        const modKey = key.charAt(0).toLowerCase() + key.slice(1);
        details[modKey] = true;

        dispatchEvent();

        return;
      }

      dispatchEvent();

      if (event !== 'keydown') return;

      const isEditable = element.isContentEditable;
      const isTextField = textFieldTags.includes(element.tagName);

      if (isEditable || isTextField) {
        const isDigit = /^[0-9]$/.test(key);

        if (isLetter || isDigit) {
          const contentKey = isEditable ? 'textContent' : 'value';
          element[contentKey] += key;

          return;
        }

        if (key === 'Enter') {
          const isSubmitForm =
            element.tagName === 'INPUT' &&
            element.form &&
            !details.ctrlKey &&
            !details.altKey;

          if (isSubmitForm) {
            element.form.submit();
            return;
          }

          element[contentKey] += '\r\n';
        }
      }
    });
  });
}
async function pressKeyWithCommand(_, keys, activeTabId) {
  for (const event of ['keyDown', 'keyUp']) {
    let modifierKey = 0;

    for (const key of keys) {
      const command = {
        tabId: activeTabId,
        method: 'Input.dispatchKeyEvent',
        params: {
          key,
          code: '',
          type: event,
          modifiers: 0,
          windowsVirtualKeyCode: 0,
        },
      };
      const definition = keyDefinitions[key];

      if (definition) {
        Object.assign(command.params, definition);

        command.params.windowsVirtualKeyCode = definition.keyCode;
        command.params.nativeVirtualKeyCode = definition.keyCode;

        const isModKey = modifierKeys.find(({ name }) => name === key);
        if (isModKey) modifierKey = isModKey.id;
        else command.params.modifiers = modifierKey;
      }

      await sendMessage('debugger:send-command', command, 'background');
    }
  }
}

async function pressKey({ data, debugMode, activeTabId }) {
  let element = document.activeElement;

  if (data.selector) {
    const customElement = await queryElements({
      selector: data.selector,
      findBy: isXPath(data.selector) ? 'xpath' : 'cssSelector',
    });

    element = customElement || element;
  }

  const keys = data.keys.split('+');
  const pressKeyFunction = debugMode ? pressKeyWithCommand : pressKeyWithJs;

  await pressKeyFunction(element, keys, activeTabId);

  return '';
}

export default pressKey;
