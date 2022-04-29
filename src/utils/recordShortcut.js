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

export default function (event, callback) {
  event.preventDefault();
  event.stopPropagation();

  if (event.repeat) return;

  const keys = [];
  const { ctrlKey, altKey, metaKey, shiftKey, key } = event;

  if (ctrlKey || metaKey) keys.push('mod');
  if (altKey) keys.push('option');
  if (shiftKey) keys.push('shift');

  const isValidKey = !!allowedKeys[key] || /^[a-z0-9,./;'[\]\-=`]$/i.test(key);

  if (isValidKey) {
    keys.push(allowedKeys[key] || key.toLowerCase());

    callback(keys);
  }
}
