import { sendMessage } from '@/utils/message';
import handleSelector from '../handle-selector';

function eventClick(block) {
  return new Promise((resolve, reject) => {
    handleSelector(block, {
      async onSelected(element) {
        const { width, height, x, y } = element.getBoundingClientRect();
        const payload = {
          tabId: block.activeTabId,
          method: 'Input.dispatchMouseEvent',
          params: {
            type: 'mousePressed',
            x: x + width / 2,
            y: y + height / 2,
            button: 'left',
            clickCount: 1,
          },
        };

        await sendMessage('debugger:send-command', payload, 'background');
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
