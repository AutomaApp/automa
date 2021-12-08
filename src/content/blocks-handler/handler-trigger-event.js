import { handleElement } from '../helper';
import simulateEvent from '@/utils/simulate-event';

function triggerEvent(block) {
  return new Promise((resolve) => {
    const { data } = block;

    handleElement(block, (element) => {
      simulateEvent(element, data.eventName, data.eventParams);
    });

    resolve(data.eventName);
  });
}

export default triggerEvent;
