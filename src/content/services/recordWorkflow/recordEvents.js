import { finder } from '@medv/finder';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import { debounce } from '@/utils/helper';
import addBlock from './addBlock';

const isAutomaInstance = (target) =>
  target.id === 'automa-recording' ||
  document.body.hasAttribute('automa-selecting');
const textFieldEl = (el) =>
  ['INPUT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable;

function changeListener({ target }) {
  if (isAutomaInstance(target)) return;

  const isInputEl = target.tagName === 'INPUT';
  const inputType = target.getAttribute('type');
  const execludeInput = isInputEl && ['checkbox', 'radio'].includes(inputType);

  if (execludeInput) return;

  let block = null;
  const selector = finder(target);
  const isSelectEl = target.tagName === 'SELECT';
  const elementName = target.ariaLabel || target.name;

  if (isInputEl && inputType === 'file') {
    block = {
      id: 'upload-file',
      description: elementName,
      data: {
        selector,
        waitForSelector: true,
        description: elementName,
        filePaths: [target.value],
      },
    };
  } else if (textFieldEl(target) || isSelectEl) {
    let description = '';

    if (elementName && elementName.length < 12) {
      description = `${isSelectEl ? 'Select' : 'Text field'} (${elementName})`;
    }

    block = {
      id: 'forms',
      data: {
        selector,
        delay: 100,
        description,
        clearValue: true,
        value: target.value,
        waitForSelector: true,
        type: isSelectEl ? 'select' : 'text-field',
      },
    };
  } else {
    block = {
      id: 'trigger-event',
      data: {
        selector,
        description,
        eventName: 'change',
        eventType: 'event',
        waitForSelector: true,
        eventParams: { bubbles: true },
      },
    };
  }

  addBlock((recording) => {
    const lastFlow = recording.flows.at(-1);
    if (block.id === 'upload-file' && lastFlow.id === 'event-click') {
      recording.flows.pop();
    }

    if (
      block.data.type === 'text-field' &&
      block.data.type === lastFlow?.data?.type
    )
      return;

    recording.flows.push(block);
  });
}
function keyEventListener(event) {
  const {
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
  } = event;
  if (isAutomaInstance(target)) return;

  const isTextField = textFieldEl(target);
  if (isTextField) {
    const enterKey = type === 'keydown' && key === 'Enter';
    const inputEl = target.form && target.tagName === 'INPUT';

    if (enterKey && inputEl) {
      event.preventDefault();
      target.dispatchEvent(new Event('change', { bubbles: true }));

      setTimeout(() => {
        target.form.submit();
      }, 500);
    }

    return;
  }

  const selector = finder(target);

  addBlock((recording) => {
    const lastFlow = recording.flows.at(-1);
    const block = {
      id: 'trigger-event',
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
        description: `${type}: ${key === ' ' ? 'Space' : key}`,
      },
    };

    if (lastFlow.id === 'trigger-event') {
      if (!lastFlow.groupId) lastFlow.groupId = nanoid();

      block.groupId = lastFlow.groupId;
    }

    recording.flows.push(block);

    return recording;
  });
}
function clickListener(event) {
  const { target } = event;

  if (isAutomaInstance(target)) return;

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

      const description = (target.innerText || target.href).slice(0, 24);

      addBlock({
        id: 'link',
        description,
        data: {
          selector,
          description,
        },
      });

      window.open(event.target.href, '_blank');

      return;
    }
  }

  const elText = (target.innerText || target.ariaLabel || target.title).slice(
    0,
    24
  );

  addBlock({
    isClickLink,
    id: 'event-click',
    description: elText,
    data: {
      selector,
      description: elText,
      waitForSelector: true,
    },
  });
}

const scrollListener = debounce(({ target }) => {
  if (isAutomaInstance(target)) return;

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
      data: {
        selector,
        smooth: true,
        scrollY: verticalScroll,
        scrollX: horizontalScroll,
      },
    });
  });
}, 500);

export function cleanUp() {
  document.removeEventListener('click', clickListener, true);
  document.removeEventListener('change', changeListener, true);
  document.removeEventListener('scroll', scrollListener, true);
  document.removeEventListener('keyup', keyEventListener, true);
  document.removeEventListener('keydown', keyEventListener, true);
}

export default async function () {
  const { isRecording } = await browser.storage.local.get('isRecording');

  if (isRecording) {
    document.addEventListener('click', clickListener, true);
    document.addEventListener('scroll', scrollListener, true);
    document.addEventListener('change', changeListener, true);
    document.addEventListener('keyup', keyEventListener, true);
    document.addEventListener('keydown', keyEventListener, true);
  }

  return cleanUp;
}
