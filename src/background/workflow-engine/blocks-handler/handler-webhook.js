import { getBlockConnection } from '../helper';
import { isWhitespace } from '@/utils/helper';
import { executeWebhook } from '@/utils/webhookUtil';

export async function webhook({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
    if (isWhitespace(data.url)) throw new Error('url-empty');
    if (!data.url.startsWith('http')) throw new Error('invalid-url');

    await executeWebhook(data);

    return {
      data: '',
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}

export default webhook;
