import { sendMessage } from '@/utils/message';
import { getElementPosition } from '../utils';
import handleSelector from '../handleSelector';

function eventClick(block) {
  return new Promise((resolve, reject) => {
    const dispatchClickEvents = (element, eventFn) => {
      const eventOpts = { bubbles: true };

      element.dispatchEvent(new MouseEvent('mousedown', eventOpts));
      element.dispatchEvent(new MouseEvent('mouseup', eventOpts));
      eventFn();
    };

    handleSelector(block, {
      async onSelected(element) {
        if (block.debugMode) {
          const { x, y } = await getElementPosition(element);
          const payload = {
            tabId: block.activeTabId,
            method: 'Input.dispatchMouseEvent',
            params: {
              x,
              y,
              button: 'left',
            },
          };
          const executeCommand = (type) => {
            payload.params.type = type;

            if (type === 'mousePressed') {
              payload.params.clickCount = 1;
            }

            return sendMessage('debugger:send-command', payload, 'background');
          };

          await executeCommand('mousePressed');
          await executeCommand('mouseReleased');

          return;
        }

        if (element.click) {
          dispatchClickEvents(element, () => element.click());
        } else {
          dispatchClickEvents(
            () => element,
            element.dispatchEvent(new PointerEvent('click', { bubbles: true }))
          );
        }
      },
      onError(error) {
        reject(error);
      },
      onSuccess() {
        resolve('');
      },
    });
  });
}

export default eventClick;
