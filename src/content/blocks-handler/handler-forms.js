import { handleElement, markElement } from '../helper';
import handleFormElement from '@/utils/handle-form-element';

function forms(block) {
  return new Promise((resolve) => {
    const { data } = block;
    const elements = handleElement(block, true);

    if (data.getValue) {
      let result = '';

      if (data.multiple) {
        result = elements.map((element) => element.value || '');
      } else {
        result = elements.value || '';
      }

      resolve(result);
      return;
    }

    if (data.multiple) {
      const promises = Array.from(elements).map((element) => {
        return new Promise((eventResolve) => {
          markElement(element, block);
          handleFormElement(element, data, eventResolve);
        });
      });

      Promise.allSettled(promises).then(() => {
        resolve('');
      });
    } else if (elements) {
      markElement(elements, block);
      handleFormElement(elements, data, resolve);
    } else {
      resolve('');
    }
  });
}

export default forms;
