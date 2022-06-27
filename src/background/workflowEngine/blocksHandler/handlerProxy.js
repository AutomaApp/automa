import browser from 'webextension-polyfill';
import { isWhitespace } from '@/utils/helper';

function setProxy({ data, id }) {
  const nextBlockId = this.getBlockConnections(id);

  return new Promise((resolve, reject) => {
    if (data.clearProxy) {
      browser.proxy.settings.clear({});
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
      let proxyHost = data.host;

      const schemeRegex = /^https?|socks4|socks5/i;
      if (schemeRegex.test(data.host)) {
        const [scheme, host] = data.host.split(/:\/\/(.*)/);
        proxyHost = host;
        config.rules.singleProxy.scheme = scheme;
      }

      config.rules.singleProxy.host = proxyHost;
    } else {
      if (data.clearProxy) {
        this.engine.isUsingProxy = false;

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
      config.rules.singleProxy.port = +data.port;
    }

    chrome.proxy.settings.set({ value: config, scope: 'regular' }, () => {
      this.engine.isUsingProxy = true;

      resolve({
        data: data.host,
        nextBlockId,
      });
    });
  });
}

export default setProxy;
