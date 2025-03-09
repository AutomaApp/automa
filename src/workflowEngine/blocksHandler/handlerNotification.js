import BrowserAPIService from '@/service/browser-api/BrowserAPIService';
import { nanoid } from 'nanoid';

export default async function ({ data, id }) {
  const hasPermission = await BrowserAPIService.permissions.contains({
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
    iconUrl: BrowserAPIService.runtime.getURL('icon-128.png'),
  };

  ['iconUrl', 'imageUrl'].forEach((key) => {
    const url = data[key];
    if (!url || !url.startsWith('http')) return;

    options[key] = url;
  });

  await BrowserAPIService.notifications.create(nanoid(), {
    ...options,
    type: options.imageUrl ? 'image' : 'basic',
  });

  return {
    data: '',
    nextBlockId: this.getBlockConnections(id),
  };
}
