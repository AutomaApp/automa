import { get } from 'object-path-immutable';
import { replaceMustache } from '@/utils/helper';

const messages = {
  'no-trigger-block': '"{{name}}"" workflow doesn\'t have a trigger block.',
  'no-block': '"{{name}}" workflow doesn\'t have any blocks.',
  'no-iframe-id':
    'Can\'t find Frame ID for the frame element with "{{selector}}" selector',
  'no-tab':
    'Can\'t connect to a tab, use "New tab" or "Active tab" block before using the "{{name}}" block.',
};

export default function (errorId, data) {
  const message = messages[errorId];

  if (!message) return `Can't find message for this error (${errorId})`;

  const resultMessage = replaceMustache(message, (match) => {
    const key = match.slice(2, -2);
    const result = get(data, key);

    return result ?? key;
  });

  return resultMessage;
}
