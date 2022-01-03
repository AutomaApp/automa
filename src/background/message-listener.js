export default function () {
  const message = new MessageListener('background');

  message.on('fetch:text', (url) => {
    return fetch(url).then((response) => response.text());
  });
  message.on('open:dashboard', async (url) => {
    const tabOptions = {
      active: true,
      url: browser.runtime.getURL(
        `/newtab.html#${typeof url === 'string' ? url : ''}`
      ),
    };

    try {
      const [tab] = await browser.tabs.query({
        url: browser.runtime.getURL('/newtab.html'),
      });

      if (tab) {
        await browser.tabs.update(tab.id, tabOptions);
        await browser.tabs.reload(tab.id);
      } else {
        browser.tabs.create(tabOptions);
      }
    } catch (error) {
      console.error(error);
    }
  });
  message.on('get:sender', (_, sender) => {
    return sender;
  });

  message.on('collection:execute', executeCollection);
  message.on('collection:stop', (id) => {
    const collection = runningCollections[id];
    if (!collection) {
      workflowState.delete(id);
      return;
    }

    collection.stop();
  });

  message.on('workflow:check-state', checkRunnigWorkflows);
  message.on('workflow:execute', (workflow) => executeWorkflow(workflow));
  message.on('workflow:stop', (id) => {
    const workflow = runningWorkflows[id];

    if (!workflow) {
      workflowState.delete(id);
      return;
    }

    workflow.stop();
  });
}
