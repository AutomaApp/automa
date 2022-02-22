import handleSelector from '../handle-selector';
import simulateEvent from '@/utils/simulate-event';

function triggerEvent(block) {
  return new Promise((resolve, reject) => {
    const { data } = block;

    handleSelector(block, {
      onSelected(element) {
        simulateEvent(element, data.eventName, data.eventParams);
      },
      onSuccess() {
        resolve(data.eventName);
      },
      onError(error) {
        reject(error);
      },
    });

    resolve(data.eventName);
  });
}

export default triggerEvent;
