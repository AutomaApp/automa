import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';

export default async function ({ data, id }) {
  const hasPermission = await browser.permissions.contains({
    permissions: ['notifications'],
  });

  if (!hasPermission) {
    const error = new Error('no-permission');
    error.data = { permission: 'notifications' };

    throw error;
  }

  const options = {
    title: data.title,
    message: data.message,
    iconUrl: browser.runtime.getURL('icon-128.png'),
  };

  ['iconUrl', 'imageUrl'].forEach((key) => {
    const url = data[key];
    if (!url || !url.startsWith('http')) return;

    options[key] = url;
  });

  await browser.notifications.create(nanoid(), {
    ...options,
    type: options.imageUrl ? 'image' : 'basic',
  });

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}
