import { onUnmounted, onMounted } from 'vue';
import Mousetrap from 'mousetrap';
import { isObject } from '@/utils/helper';

export const mapShortcuts = {
  'page:dashboard': {
    id: 'page:dashboard',
    combo: 'option+1',
  },
  'page:workflows': {
    id: 'page:workflows',
    combo: 'option+2',
  },
  'page:collections': {
    id: 'page:collections',
    combo: 'option+3',
  },
  'page:logs': {
    id: 'page:logs',
    combo: 'option+4',
  },
  'page:settings': {
    id: 'page:settings',
    combo: 'option+5',
  },
  'action:search': {
    id: 'action:search',
    combo: 'mod+shift+f',
  },
  'editor:duplicate-block': {
    id: 'editor:duplicate-block',
    combo: 'mod+option+d',
  },
  'editor:save': {
    id: 'editor:save',
    combo: 'mod+shift+s',
  },
  'editor:execute-workflow': {
    id: 'editor:execute-workflow',
    combo: 'option+enter',
  },
};

const os = navigator.appVersion.indexOf('Win') !== -1 ? 'win' : 'mac';
export function getReadableShortcut(str) {
  const list = {
    option: {
      win: 'alt',
      mac: 'option',
    },
    mod: {
      win: 'ctrl',
      mac: '⌘',
    },
  };
  const regex = new RegExp(Object.keys(list).join('|'), 'g');
  const replacedStr = str.replace(regex, (match) => {
    return list[match][os];
  });

  return replacedStr;
}

export function getShortcut(id, data) {
  const shortcut = mapShortcuts[id] || {};

  if (data) shortcut.data = data;
  if (!shortcut.readable) {
    shortcut.readable = getReadableShortcut(shortcut.combo);
  }

  return shortcut;
}

export function useShortcut(shortcuts, handler) {
  Mousetrap.prototype.stopCallback = () => false;

  const extractedShortcuts = {
    ids: {},
    keys: [],
    data: {},
  };
  const handleShortcut = (event, combo) => {
    const shortcutId = extractedShortcuts.ids[combo];
    const params = {
      event,
      ...extractedShortcuts.data[shortcutId],
    };

    if (typeof params.data === 'function') {
      params.data(params);
    } else {
      handler?.(params);
    }
  };
  const addShortcutData = ({ combo, id, readable, ...rest }) => {
    extractedShortcuts.ids[combo] = id;
    extractedShortcuts.keys.push(combo);
    extractedShortcuts.data[id] = { combo, id, readable, ...rest };
  };

  if (isObject(shortcuts)) {
    addShortcutData(getShortcut(shortcuts.id, shortcuts.data));
  } else if (typeof shortcuts === 'string') {
    addShortcutData(getShortcut(shortcuts));
  } else {
    shortcuts.forEach((item) => {
      const currentShortcut =
        typeof item === 'string' ? getShortcut(item) : item;

      addShortcutData(currentShortcut);
    });
  }

  onMounted(() => {
    Mousetrap.bind(extractedShortcuts.keys, handleShortcut);
  });
  onUnmounted(() => {
    Mousetrap.unbind(extractedShortcuts.keys);
  });

  return extractedShortcuts.data;
}
