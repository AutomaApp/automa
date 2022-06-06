import { finder } from '@medv/finder';
import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import { debounce } from '@/utils/helper';
import { recordPressedKey } from '@/utils/recordKeys';
import addBlockToFlow from './addBlock';

let isMainFrame = true;

const isAutomaInstance = (target) =>
  target.id === 'automa-recording' ||
  document.body.hasAttribute('automa-selecting');
const textFieldEl = (el) =>
  ['INPUT', 'TEXTAREA'].includes(el.tagName) || el.isContentEditable;

function findSelector(element) {
  return finder(element, {
    tagName: () => true,
    attr: (name, value) => name === 'id' || (name.startsWith('aria') && value),
  });
}
async function addBlock(detail) {
  try {
    const data = await addBlockToFlow(detail, isMainFrame);

    if (!isMainFrame || !data || !data.addedBlock) {
      let frameSelector = null;

      if (window.frameElement) {
        frameSelector = finder(window.frameElement, {
          root: window.frameElement.ownerDocument,
        });
      }

      window.top.postMessage(
        {
          frameSelector,
          recording: data.recording,
          type: 'automa:record-events',
        },
        '*'
      );
    }
  } catch (error) {
    console.error(error);
  }
}

function onChange({ target }) {
  if (isAutomaInstance(target)) return;

  const isInputEl = target.tagName === 'INPUT';
  const inputType = target.getAttribute('type');
  const execludeInput = isInputEl && ['checkbox', 'radio'].includes(inputType);

  if (execludeInput) return;

  let block = null;
  const selector = findSelector(target);
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
      block.data.selector === lastFlow?.data?.selector
    )
      return null;

    recording.flows.push(block);

    return block;
  });
}
async function onKeydown(event) {
  if (isAutomaInstance(event.target) || event.repeat) return;

  const isTextField = textFieldEl(event.target);
  const enterKey = event.key === 'Enter';
  let isSubmitting = false;

  if (isTextField) {
    const inputInForm = event.target.form && event.target.tagName === 'INPUT';

    if (enterKey && inputInForm) {
      event.preventDefault();

      await addBlock({
        id: 'forms',
        data: {
          delay: 100,
          clearValue: true,
          type: 'text-field',
          waitForSelector: true,
          value: event.target.value,
          selector: findSelector(event.target),
        },
      });

      isSubmitting = true;
    } else {
      return;
    }
  }

  recordPressedKey(event, (keysArr) => {
    const selector = isTextField && enterKey ? findSelector(event.target) : '';
    const keys = keysArr.join('+');

    addBlock((recording) => {
      const block = {
        id: 'press-key',
        description: `Press: ${keys}`,
        data: {
          keys,
          selector,
        },
      };

      const lastFlow = recording.flows.at(-1);
      if (lastFlow.id === 'press-key') {
        if (!lastFlow.groupId) lastFlow.groupId = nanoid();
        block.groupId = lastFlow.groupId;
      }

      recording.flows.push(block);

      if (isSubmitting) {
        setTimeout(() => {
          event.target.form.submit();
        }, 500);
      }

      return block;
    });
  });
}
function onClick(event) {
  const { target } = event;

  if (isAutomaInstance(target)) return;

  const isTextField =
    (target.tagName === 'INPUT' && target.getAttribute('type') === 'text') ||
    ['SELECT', 'TEXTAREA'].includes(target.tagName);

  if (isTextField) return;

  let isClickLink = false;
  const selector = findSelector(target);

  if (target.tagName === 'A') {
    if (event.ctrlKey || event.metaKey) return;

    const openInNewTab = target.getAttribute('target') === '_blank';
    isClickLink = true;

    if (openInNewTab) {
      event.preventDefault();

      const description = (target.innerText || target.href)?.slice(0, 24) || '';

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

  const elText =
    (target.innerText || target.ariaLabel || target.title)?.slice(0, 24) || '';

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

const onMessage = debounce(({ data, source }) => {
  if (data.type !== 'automa:record-events') return;

  let { frameSelector } = data;

  if (!frameSelector) {
    const frames = document.querySelectorAll('iframe, frame');

    frames.forEach((frame) => {
      if (frame.contentWindow !== source) return;

      frameSelector = finder(frame);
    });
  }

  const lastFlow = data.recording.flows.at(-1);
  const lastIndex = data.recording.flows.length - 1;
  data.recording.flows[
    lastIndex
  ].data.selector = `${frameSelector} |> ${lastFlow.data.selector}`;

  browser.storage.local.set({ recording: data.recording });
}, 100);
const onScroll = debounce(({ target }) => {
  if (isAutomaInstance(target)) return;

  const isDocument = target === document;
  const element = isDocument ? document.documentElement : target;
  const selector = isDocument ? 'html' : findSelector(target);

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
  if (isMainFrame) {
    window.removeEventListener('message', onMessage);
    document.removeEventListener('scroll', onScroll, true);
  }

  document.removeEventListener('click', onClick, true);
  document.removeEventListener('change', onChange, true);
  document.removeEventListener('keydown', onKeydown, true);
}

export default async function (mainFrame) {
  const { isRecording } = await browser.storage.local.get('isRecording');

  isMainFrame = mainFrame;

  if (isRecording) {
    if (isMainFrame) {
      window.addEventListener('message', onMessage);
      document.addEventListener('scroll', onScroll, true);
    }

    document.addEventListener('click', onClick, true);
    document.addEventListener('change', onChange, true);
    document.addEventListener('keydown', onKeydown, true);
  }

  return cleanUp;
}
