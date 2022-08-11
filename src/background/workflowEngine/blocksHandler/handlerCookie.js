import browser from 'webextension-polyfill';

function getValues(data, keys) {
  const values = {};
  keys.forEach((key) => {
    const value = data[key];

    if (!value && typeof value !== 'boolean') return;

    values[key] = value;
  });

  return values;
}

const keys = {
  get: ['name', 'url'],
  remove: ['name', 'url'],
  getAll: ['domain', 'name', 'path', 'secure', 'url'],
  set: [
    'name',
    'url',
    'expirationDate',
    'domain',
    'path',
    'sameSite',
    'secure',
    'url',
    'value',
    'httpOnly',
  ],
};

async function cookie({ data, id }) {
  const hasPermission = await browser.permissions.contains({
    permissions: ['cookies'],
  });

  if (!hasPermission) {
    const error = new Error('no-permission');
    error.data = { permission: 'cookies' };

    throw error;
  }

  let key = data.type;
  if (key === 'get' && data.getAll) key = 'getAll';

  const values = getValues(data, keys[key]);
  if (values.expirationDate) {
    values.expirationDate = Date.now() / 1000 + +values.expirationDate;
  }

  const result = await browser.cookies[key](values);

  if (data.type === 'get') {
    if (data.assignVariable) {
      this.setVariable(data.variableName, result);
    }
    if (data.saveData) {
      this.addDataToColumn(data.dataColumn, result);
    }
  }

  return {
    data: result,
    nextBlockId: this.getBlockConnections(id),
  };
}

export default cookie;
