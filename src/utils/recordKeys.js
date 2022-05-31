import { toCamelCase } from './helper';

const modifierKeys = ['Control', 'Alt', 'Shift', 'Meta'];
export function recordPressedKey(
  { repeat, shiftKey, metaKey, altKey, ctrlKey, key },
  callback
) {
  if (repeat || modifierKeys.includes(key)) return;

  let pressedKey = key.length > 1 || shiftKey ? toCamelCase(key, true) : key;

  if (pressedKey === ' ') pressedKey = 'Space';
  else if (pressedKey === '+') pressedKey = 'NumpadAdd';

  const keys = [pressedKey];

  if (shiftKey) keys.unshift('Shift');
  if (metaKey) keys.unshift('Meta');
  if (altKey) keys.unshift('Alt');
  if (ctrlKey) keys.unshift('Control');

  if (callback) callback(keys);
}

const allowedKeys = {
  '+': 'plus',
  Delete: 'del',
  Insert: 'ins',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowUp: 'up',
  ArrowRight: 'right',
  Escape: 'escape',
  Enter: 'enter',
};
export function recordShortcut(
  { ctrlKey, altKey, metaKey, shiftKey, key, repeat },
  callback
) {
  if (repeat) return;

  const keys = [];

  if (ctrlKey || metaKey) keys.push('mod');
  if (altKey) keys.push('option');
  if (shiftKey) keys.push('shift');

  const isValidKey = !!allowedKeys[key] || /^[a-z0-9,./;'[\]\-=`]$/i.test(key);

  if (isValidKey) {
    keys.push(allowedKeys[key] || key.toLowerCase());

    callback(keys);
  }
}
