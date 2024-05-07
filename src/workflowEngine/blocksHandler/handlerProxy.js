import { isWhitespace } from '@/utils/helper';
import BrowserAPIService from '@/service/browser-api/BrowserAPIService';

function setProxy({ data, id }) {
  const nextBlockId = this.getBlockConnections(id);

  return new Promise((resolve, reject) => {
    if (data.clearProxy) {
      BrowserAPIService.proxy.settings.clear({});
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

    let proxyPort = data.port;

    if (!isWhitespace(data.host)) {
      let proxyHost = data.host;

      const schemeRegex = /^https?|socks4|socks5/i;
      if (schemeRegex.test(data.host)) {
        /* eslint-disable-next-line */
        let [scheme, host] = data.host.split(/:\/\/(.*)/);

        if (host.includes(':')) {
          [host, proxyPort] = host.split(':');
        }

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

    if (proxyPort && !Number.isNaN(+proxyPort)) {
      config.rules.singleProxy.port = +proxyPort;
    }
    BrowserAPIService.proxy.settings
      .set({ value: config, scope: 'regular' })
      .then(() => {
        this.engine.isUsingProxy = true;

        resolve({
          data: data.host,
          nextBlockId,
        });
      });
  });
}

export default setProxy;
