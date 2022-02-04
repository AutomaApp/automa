import { finder } from '@medv/finder';
import browser from 'webextension-polyfill';
import { debounce } from '@/utils/helper';

const textFieldEl = (el) =>
  ['INPUT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable;

async function addBlock(detail) {
  const { isRecording, recording } = await browser.storage.local.get([
    'isRecording',
    'recording',
  ]);

  if (!isRecording || !recording) return;

  if (typeof detail === 'function') detail(recording);
  else recording.flows.push(detail);

  await browser.storage.local.set({ recording });
}

function changeListener({ target }) {
  const isInputEl = target.tagName === 'INPUT';
  const inputType = target.getAttribute('type');
  const execludeInput = isInputEl && ['checkbox', 'radio'].includes(inputType);

  if (execludeInput) return;

  let block = null;
  const selector = finder(target);
  const isSelectEl = target.tagName === 'SELECT';
  const elementName = target.ariaLabel || target.name || selector;

  if (isInputEl && inputType === 'file') {
    block = {
      id: 'upload-file',
      description: elementName,
      data: {
        selector,
        filePaths: [target.value],
      },
    };
  } else if (textFieldEl(target) || isSelectEl) {
    block = {
      id: 'forms',
      description: `${isSelectEl ? 'Select' : 'Text field'} (${elementName})`,
      data: {
        selector,
        delay: 100,
        clearValue: true,
        value: target.value,
        type: isSelectEl ? 'select' : 'text-field',
      },
    };
  } else {
    block = {
      id: 'trigger-event',
      description: `Change event (${selector})`,
      data: {
        selector,
        eventName: 'change',
        eventType: 'event',
        eventParams: { bubbles: true },
      },
    };
  }

  addBlock((recording) => {
    const lastFlow = recording.flows.at(-1);
    if (block.id === 'upload-file' && lastFlow.id === 'event-click') {
      recording.flows.pop();
    }

    recording.flows.push(block);
  });
}
function keyEventListener({
  target,
  code,
  key,
  keyCode,
  altKey,
  ctrlKey,
  metaKey,
  shiftKey,
  type,
  repeat,
}) {
  const isTextField = textFieldEl(target);

  if (isTextField) return;

  const selector = finder(target);

  addBlock({
    id: 'trigger-event',
    description: `${type}(${key === ' ' ? 'Space' : key}): ${selector}`,
    data: {
      selector,
      eventName: type,
      eventType: 'keyboard-event',
      eventParams: {
        key,
        code,
        repeat,
        altKey,
        ctrlKey,
        metaKey,
        keyCode,
        shiftKey,
      },
    },
  });
}
function clickListener(event) {
  const { target } = event;
  let isClickLink = true;
  const isTextField =
    (target.tagName === 'INPUT' && target.getAttribute('type') === 'text') ||
    ['SELECT', 'TEXTAREA'].includes(target.tagName);

  if (isTextField) return;

  const selector = finder(target);

  if (target.tagName === 'A') {
    if (event.ctrlKey || event.metaKey) return;

    const openInNewTab = target.getAttribute('target') === '_blank';
    isClickLink = true;

    if (openInNewTab) {
      event.preventDefault();

      addBlock({
        id: 'link',
        data: { selector },
        description: target.href,
      });

      window.open(event.target.href, '_blank');

      return;
    }
  }

  addBlock({
    isClickLink,
    id: 'event-click',
    data: { selector },
    description: target.innerText.slice(0, 64) || selector,
  });
}

const scrollListener = debounce(({ target }) => {
  const isDocument = target === document;
  const element = isDocument ? document.documentElement : target;
  const selector = isDocument ? 'html' : finder(target);

  addBlock((recording) => {
    const lastFlow = recording.flows[recording.flows.length - 1];
    const verticalScroll = element.scrollTop || element.scrollY || 0;
    const horizontalScroll = element.scrollLeft || element.scrollX || 0;

    if (lastFlow.id === 'element-scroll') {
      lastFlow.data.scrollY = verticalScroll;
      lastFlow.data.scrollX = horizontalScroll;

      return;
    }

    recording.flows.push({
      id: 'element-scroll',
      description: selector,
      data: {
        selector,
        smooth: true,
        scrollY: verticalScroll,
        scrollX: horizontalScroll,
      },
    });
  });
}, 500);

function cleanUp() {
  document.removeEventListener('click', clickListener, true);
  document.removeEventListener('change', changeListener, true);
  document.removeEventListener('scroll', scrollListener, true);
  document.removeEventListener('keyup', keyEventListener, true);
  document.removeEventListener('keydown', keyEventListener, true);
}
function messageListener({ type }) {
  if (type === 'recording:stop') {
    cleanUp();
    browser.runtime.onMessage.removeListener(messageListener);
  }
}

(async () => {
  const { isRecording } = await browser.storage.local.get('isRecording');

  if (!isRecording) return;

  document.addEventListener('click', clickListener, true);
  document.addEventListener('scroll', scrollListener, true);
  document.addEventListener('change', changeListener, true);
  document.addEventListener('keyup', keyEventListener, true);
  document.addEventListener('keydown', keyEventListener, true);

  browser.runtime.onMessage.addListener(messageListener);
})();
