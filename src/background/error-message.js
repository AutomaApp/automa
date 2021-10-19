import { objectHasKey } from '@/utils/helper';

const messages = {
  'no-trigger-block': '"{{name}}"" workflow doesn\'t have a trigger block.',
  'no-block': '"{{name}}" workflow doesn\'t have any blocks.',
  'no-tab':
    'Can\'t connect to a tab, use "New tab" or "Active tab" block before using "{{name}}" block.',
};

export default function (errorId, data) {
  const message = messages[errorId];

  if (!message) return `Can't find message for this error (${errorId})`;

  /* eslint-disable-next-line */
  const resultMessage = message.replace(/{{\s*[\w\.]+\s*}}/g, (match) => {
    const key = match.replace(/{|}/g, '');

    return objectHasKey(data, key) ? data[key] : key;
  });

  return resultMessage;
}
