import { handleElement } from '../helper';
import simulateEvent from '@/utils/simulate-event';

function triggerEvent(block) {
  return new Promise((resolve, reject) => {
    const { data } = block;

    handleElement(block, {
      onSelected(element) {
        simulateEvent(element, data.eventName, data.eventParams);
      },
      onSuccess() {
        resolve(data.eventName);
      },
      onError() {
        reject(new Error('element-not-found'));
      },
    });

    resolve(data.eventName);
  });
}

export default triggerEvent;
