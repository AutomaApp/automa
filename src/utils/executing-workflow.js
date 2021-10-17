import browser from 'webextension-polyfill';

function getWorkflows() {
  return new Promise((resolve) => {
    browser.storage.local
      .get('executingWorkflow')
      .then(({ executingWorkflow }) => {
        console.log(executingWorkflow);
        resolve(executingWorkflow || []);
      });
  });
}
async function updater(callback) {
  try {
    const executingWorkflow = await getWorkflows();
    const items = callback(executingWorkflow);

    await browser.storage.local.set({ executingWorkflow: items });

    return items;
  } catch (error) {
    console.error(error);
    return [];
  }
}
function setWorkflow(id, workflow) {
  return updater((items) => {
    items.push({ id, workflow });

    return items;
  });
}
async function findWorkflows(callback) {
  try {
    const workflows = await getWorkflows();

    return workflows.find(callback);
  } catch (error) {
    console.error(error);
    return [];
  }
}
function deleteWorkflow(id) {
  return updater((items) => {
    const index = items.findIndex((item) => item.id === id);

    items.splice(index, 1);

    return items;
  });
}
function update(id, data = {}) {
  return updater((items) => {
    const index = items.findIndex((item) => item.id === id);

    /* eslint-disable-next-line */
    if (index !== -1) items[index] = { ...data, id };

    return items;
  });
}

export default {
  update,
  set: setWorkflow,
  get: getWorkflows,
  find: findWorkflows,
  delete: deleteWorkflow,
};
