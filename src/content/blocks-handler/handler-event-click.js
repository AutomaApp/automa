import { sendMessage } from '@/utils/message';
import handleSelector from '../handle-selector';

function eventClick(block) {
  return new Promise((resolve, reject) => {
    handleSelector(block, {
      async onSelected(element) {
        if (block.debugMode) {
          const { width, height, x, y } = element.getBoundingClientRect();
          const payload = {
            tabId: block.activeTabId,
            method: 'Input.dispatchMouseEvent',
            params: {
              x: x + width / 2,
              y: y + height / 2,
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
          element.click();
        } else {
          element.dispatchEvent(new PointerEvent('click', { bubbles: true }));
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
