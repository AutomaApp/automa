import handleFormElement from '@/utils/handleFormElement';
import { sendMessage } from '@/utils/message';
import renderString from '@/workflowEngine/templating/renderString';
import handleSelector, { markElement } from '../handleSelector';
import synchronizedLock from '../synchronizedLock';

async function forms(block) {
  const { data } = block;
  const elements = await handleSelector(block, { returnElement: true });

  if (!elements) {
    throw new Error('element-not-found');
  }

  if (data.getValue) {
    let result = '';

    if (data.multiple) {
      result = elements.map((element) => element.value || '');
    } else {
      result = elements.value || '';
    }

    return result;
  }

  async function typeText(element) {
    if (block.debugMode && data.type === 'text-field') {
      // get lock
      await synchronizedLock.getLock();
      element.focus?.();

      try {
        if (data.clearValue) {
          const backspaceCommands = new Array(element.value?.length ?? 0).fill({
            type: 'rawKeyDown',
            unmodifiedText: 'Delete',
            text: 'Delete',
            windowsVirtualKeyCode: 46,
          });

          await sendMessage(
            'debugger:type',
            { commands: backspaceCommands, tabId: block.activeTabId, delay: 0 },
            'background'
          );
        }

        const renderedResult = await renderString(data.value, block.refData);
        const textValue = renderedResult.value || '';
        const commands = textValue.split('').map((char) => ({
          type: 'keyDown',
          text: char === '\n' ? '\r' : char,
        }));
        const typeDelay = +block.data.delay;
        await sendMessage(
          'debugger:type',
          {
            commands,
            tabId: block.activeTabId,
            delay: Number.isNaN(typeDelay) ? 0 : typeDelay,
          },
          'background'
        );
      } finally {
        synchronizedLock.releaseLock();
      }
      return;
    }

    markElement(element, block);
    await handleFormElement(element, data);
  }

  if (data.multiple) {
    const promises = Array.from(elements).map((element) => typeText(element));

    await Promise.allSettled(promises);
  } else {
    await typeText(elements);
  }

  return null;
}

export default forms;
