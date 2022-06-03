import { nanoid } from 'nanoid';
import browser from 'webextension-polyfill';
import { getBlockConnection } from '../helper';

export default async function ({ data, outputs }) {
  const nextBlockId = getBlockConnection({ outputs });

  try {
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
      nextBlockId,
    };
  } catch (error) {
    error.nextBlockId = nextBlockId;

    throw error;
  }
}
