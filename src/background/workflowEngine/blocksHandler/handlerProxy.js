import { isWhitespace } from '@/utils/helper';
import { getBlockConnection } from '../helper';

function setProxy({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  return new Promise((resolve, reject) => {
    if (data.clearProxy) {
      chrome.proxy.settings.clear({});
    }

    const config = {
      mode: 'fixed_servers',
      rules: {
        singleProxy: {
          scheme: data.scheme,
        },
        bypassList: isWhitespace(data.bypassList)
          ? []
          : data.bypassList.split(','),
      },
    };

    if (!isWhitespace(data.host)) {
      config.rules.singleProxy.host = data.host;
    } else {
      if (data.clearProxy) {
        this.isUsingProxy = false;

        resolve({
          data: '',
          nextBlockId,
        });

        return;
      }

      const error = new Error('invalid-proxy-host');
      error.nextBlockId = nextBlockId;

      reject(error);
      return;
    }

    if (data.port !== 0) {
      config.rules.singleProxy.port = data.port;
    }

    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
      this.isUsingProxy = true;

      resolve({
        data: data.host,
        nextBlockId,
      });
    });
  });
}

export default setProxy;
