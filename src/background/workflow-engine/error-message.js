import { objectHasKey, replaceMustache } from '@/utils/helper';

const messages = {
  'no-trigger-block': '"{{name}}"" workflow doesn\'t have a trigger block.',
  'no-block': '"{{name}}" workflow doesn\'t have any blocks.',
  'no-tab':
    'Can\'t connect to a tab, use "New tab" or "Active tab" block before using the "{{name}}" block.',
};

export default function (errorId, data) {
  const message = messages[errorId];

  if (!message) return `Can't find message for this error (${errorId})`;

  /* eslint-disable-next-line */
  const resultMessage = replaceMustache(message, (match) => {
    const key = match.slice(2, -2);

    return objectHasKey(data, key) ? data[key] : key;
  });

  return resultMessage;
}
