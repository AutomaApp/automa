import { keyDefinitions } from '@/utils/us-keyboard-layout';
import simulateEvent from './simulate-event';

function formEvent(element, data) {
  if (data.type === 'text-field') {
    const currentKey = /\s/.test(data.value) ? 'Space' : data.value;
    const { key, keyCode, code } = keyDefinitions[currentKey] || {
      key: currentKey,
      keyCode: 0,
      code: `Key${currentKey}`,
    };

    simulateEvent(element, 'keydown', {
      key,
      code,
      keyCode,
      bubbles: true,
      cancelable: true,
    });
    simulateEvent(element, 'keyup', {
      key,
      code,
      keyCode,
      bubbles: true,
      cancelable: true,
    });
  }

  simulateEvent(element, 'input', {
    inputType: 'insertText',
    data: data.value,
    bubbles: true,
    cancelable: true,
  });
  element.dispatchEvent(
    new Event('change', { bubbles: true, cancelable: true })
  );
}
async function inputText({ data, element, isEditable }) {
  const elementKey = isEditable ? 'textContent' : 'value';

  if (data.delay > 0) {
    for (let index = 0; index < data.value.length; index += 1) {
      const currentChar = data.value[index];

      element[elementKey] += currentChar;
      formEvent(element, {
        type: 'text-field',
        value: currentChar,
        isEditable,
      });

      await new Promise((r) => setTimeout(r, data.delay));
    }
  } else {
    element[elementKey] += data.value;
    formEvent(element, {
      isEditable,
      type: 'text-field',
      value: data.value[0] ?? '',
    });
  }
}

export default async function (element, data) {
  const textFields = ['INPUT', 'TEXTAREA'];
  const isEditable =
    element.hasAttribute('contenteditable') && element.isContentEditable;

  if (isEditable) {
    if (data.clearValue) element.innerText = '';

    await inputText({ data, element, isEditable });
    return;
  }

  if (data.type === 'text-field' && textFields.includes(element.tagName)) {
    if (data.clearValue) element.value = '';

    await inputText({ data, element });
    return;
  }

  if (data.type === 'checkbox' || data.type === 'radio') {
    element.checked = data.selected;
    formEvent(element, { type: data.type, value: data.selected });
    return;
  }

  if (data.type === 'select') {
    element.value = data.value;
    formEvent(element, data);
  }
}
