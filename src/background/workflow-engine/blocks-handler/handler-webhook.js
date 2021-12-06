import { getBlockConnection } from '../helper';
import { executeWebhook } from '@/utils/webhookUtil';

function webhook({ data, outputs }) {
  return new Promise((resolve, reject) => {
    const nextBlockId = getBlockConnection({ outputs });

    if (!data.url) {
      const error = new Error('URL is empty');
      error.nextBlockId = nextBlockId;

      reject(error);
      return;
    }

    if (!data.url.startsWith('http')) {
      const error = new Error('URL is not valid');
      error.nextBlockId = nextBlockId;

      reject(error);
      return;
    }

    executeWebhook(data)
      .then(() => {
        resolve({
          data: '',
          nextBlockId: getBlockConnection({ outputs }),
        });
      })
      .catch((error) => {
        reject(error);
      });
  });
}

export default webhook;
