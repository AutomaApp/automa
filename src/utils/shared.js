export const tasks = {
  trigger: {
    name: 'Trigger',
    icon: 'riFlashlightLine',
    component: 'task-',
    category: 'general',
  },
  'event-click': {
    name: 'Click element',
    icon: 'riCursorLine',
    component: 'NodeBase',
    category: 'interaction',
  },
  delay: {
    name: 'Delay',
    icon: 'riTimerLine',
    component: 'NodeBase',
    category: 'general',
  },
  'get-text': {
    name: 'Get text',
    icon: 'riParagraph',
    component: 'NodeBase',
    category: 'interaction',
  },
  'export-data': {
    name: 'Export data',
    icon: 'riDownloadLine',
    component: 'task-',
    category: 'general',
  },
  'element-scroll': {
    name: 'Scroll element',
    icon: 'riMouseLine',
    component: 'NodeBase',
    category: 'interaction',
  },
  'get-attribute': {
    name: 'Get attribute',
    icon: 'riBracketsLine',
    component: 'task-',
    category: 'interaction',
  },
  'open-website': {
    name: 'Open website',
    icon: 'riGlobalLine',
    component: 'task-',
    category: 'general',
  },
  'text-input': {
    name: 'Text input',
    icon: 'riInputCursorMove',
    component: 'task-',
    category: 'interaction',
  },
  'repeat-task': {
    name: 'Repeat tasks',
    icon: 'riRepeat2Line',
    component: 'task-',
    category: 'general',
  },
  'trigger-element-events': {
    name: 'Trigger element events',
    icon: 'riLightbulbFlashLine',
    component: 'task-',
    category: 'interaction',
  },
};

export const categories = {
  interaction: {
    name: 'Web interaction',
    color: 'bg-green-200',
  },
  general: {
    name: 'General',
    color: 'bg-yellow-200',
  },
};

export const conditions = {
  /* has attribute or attribute value/key equel to */
  attribute: {},
};
