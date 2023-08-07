import { sleep } from '@/utils/helper';
import { keyDefinitions } from '@/utils/USKeyboardLayout';
import simulateEvent from './simulateEvent';

const nativeInputValueSetter = Object.getOwnPropertyDescriptor(
  window.HTMLInputElement.prototype,
  'value'
).set;
function reactJsEvent(element, value) {
  if (!element._valueTracker) return;

  const previousValue = element.value;
  nativeInputValueSetter.call(element, value);
  element._valueTracker.setValue(previousValue);
}

function formEvent(element, data) {
  if (data.type === 'text-field') {
    const currentKey = /\s/.test(data.value) ? 'Space' : data.value;
    const { key, keyCode, code } = keyDefinitions[currentKey] || {
      key: currentKey,
      keyCode: 0,
      code: `Key${currentKey}`,
    };

    simulateEvent(element, 'input', {
      inputType: 'insertText',
      data: data.value,
      bubbles: true,
      cancelable: true,
    });

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

  if (data.type !== 'text-field') {
    element.dispatchEvent(
      new Event('change', { bubbles: true, cancelable: true })
    );
  }
}
async function inputText({ data, element, isEditable }) {
  element?.focus();
  element?.click();
  const elementKey = isEditable ? 'textContent' : 'value';

  if (data.delay > 0 && !document.hidden) {
    for (let index = 0; index < data.value.length; index += 1) {
      if (elementKey === 'value') reactJsEvent(element, element.value);

      const currentChar = data.value[index];
      element[elementKey] += currentChar;

      formEvent(element, {
        type: 'text-field',
        value: currentChar,
        isEditable,
      });

      await sleep(data.delay);
    }
  } else {
    if (elementKey === 'value') reactJsEvent(element, element.value);

    element[elementKey] += data.value;

    formEvent(element, {
      isEditable,
      type: 'text-field',
      value: data.value[0] ?? '',
    });
  }

  element.dispatchEvent(
    new Event('change', { bubbles: true, cancelable: true })
  );

  element?.blur();
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
    if (data.clearValue) {
      element?.select();
      reactJsEvent(element, '');
      element.value = '';
    }

    await inputText({ data, element });
    return;
  }

  element?.focus();

  if (data.type === 'checkbox' || data.type === 'radio') {
    element.checked = data.selected;
    formEvent(element, { type: data.type, value: data.selected });
  } else if (data.type === 'select') {
    let optionValue = data.value;

    const options = element.querySelectorAll('option');
    const getOptionValue = (index) => {
      if (!options) return element.value;

      let optionIndex = index;
      const maxIndex = options.length - 1;

      if (index < 0) optionIndex = 0;
      else if (index > maxIndex) optionIndex = maxIndex;

      return options[optionIndex]?.value || element.value;
    };

    switch (data.selectOptionBy) {
      case 'first-option':
        optionValue = getOptionValue(0);
        break;
      case 'last-option':
        optionValue = getOptionValue(options.length - 1);
        break;
      case 'custom-position':
        optionValue = getOptionValue(+data.optionPosition - 1 ?? 0);
        break;
      default:
    }

    if (optionValue) {
      element.value = optionValue;
      formEvent(element, data);
    }
  }

  element?.blur();
}
